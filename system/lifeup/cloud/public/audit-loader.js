const nativeFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
  const requestUrl = new URL(typeof input === 'string' ? input : input.url, window.location.href);
  const method = String(init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();

  if (requestUrl.origin === window.location.origin && requestUrl.pathname === '/api/v1/snapshot') {
    requestUrl.searchParams.set('visual-audit', '1');
    return nativeFetch(requestUrl.href, init);
  }

  if (requestUrl.origin === window.location.origin && requestUrl.pathname.startsWith('/api/') && !['GET', 'HEAD'].includes(method)) {
    return new Response(JSON.stringify({ error: 'VISUAL_AUDIT_READ_ONLY' }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  return nativeFetch(input, init);
};

await import('/app-v2.js');
