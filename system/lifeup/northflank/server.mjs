import { randomUUID, timingSafeEqual } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { isInitializeRequest } from '@modelcontextprotocol/server';
import { createServer as createLifeUpServer } from '/opt/lifeup-sdk/mcp/dist/index.js';

const port = Number(process.env.PORT || 8080);
const bearer = process.env.MCP_BEARER_TOKEN || '';
const allowedHosts = (process.env.MCP_ALLOWED_HOSTS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (!bearer) {
  console.error('MCP_BEARER_TOKEN is required');
  process.exit(1);
}

const app = createMcpExpressApp(
  allowedHosts.length > 0
    ? { host: '0.0.0.0', allowedHosts }
    : { host: '0.0.0.0' },
);

function authorized(header) {
  if (!header?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(bearer);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, service: 'ron-lifeup-mcp' });
});

app.use('/mcp', (req, res, next) => {
  if (!authorized(req.headers.authorization)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
});

const sessions = new Map();

app.all('/mcp', async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id'];

    if (typeof sessionId === 'string' && sessions.has(sessionId)) {
      await sessions.get(sessionId).handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => sessions.set(id, transport),
      });

      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };

      const server = createLifeUpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    const status = sessionId ? 404 : 400;
    res.status(status).json({
      jsonrpc: '2.0',
      error: {
        code: sessionId ? -32001 : -32000,
        message: sessionId ? 'Session not found' : 'Bad Request: session initialization required',
      },
      id: null,
    });
  } catch (error) {
    console.error('MCP request failed', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal MCP server error' },
        id: null,
      });
    }
  }
});

const httpServer = app.listen(port, '0.0.0.0', () => {
  console.error(`ron-lifeup-mcp listening on :${port}/mcp`);
});

async function shutdown(signal) {
  console.error(`received ${signal}; closing ${sessions.size} MCP session(s)`);
  for (const transport of sessions.values()) {
    try {
      await transport.close();
    } catch (error) {
      console.error('session close failed', error);
    }
  }
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
