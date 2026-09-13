import { createServer, request as httpRequest } from 'node:http';
import { allowsUnauthenticatedSnapshotRead } from './read-access.mjs';

const publicPort = Number(process.env.PORT || 8080);
const backendPort = publicPort + 1;
const bearer = process.env.SYSTEM_BEARER_TOKEN?.trim();
if (!bearer) throw new Error('SYSTEM_BEARER_TOKEN is required');

process.env.PORT = String(backendPort);
await import('./server-v2.mjs');

const gateway = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const headers = { ...req.headers, host: `127.0.0.1:${backendPort}` };

  if (allowsUnauthenticatedSnapshotRead({ method: req.method, pathname: url.pathname, searchParams: url.searchParams })) {
    headers.authorization = `Bearer ${bearer}`;
  }

  const upstream = httpRequest({
    hostname: '127.0.0.1',
    port: backendPort,
    method: req.method,
    path: req.url,
    headers
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'gateway upstream unavailable' }));
  });
  req.pipe(upstream);
});

gateway.listen(publicPort, '0.0.0.0', () => {
  console.error(`ron-system-audit-gateway listening on :${publicPort}`);
});
