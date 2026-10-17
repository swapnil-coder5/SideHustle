import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analyze, models } from './lib/analyze.mjs';

const port = Number(process.env.PORT || 3210);
const assets = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']], ['/samples.js', ['samples.js', 'text/javascript']]]);
let busy = false;
const server = createServer(async (req, res) => {
  const headers = {
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  };
  const send = (status, value, type = 'application/json') => { res.writeHead(status, { ...headers, 'Content-Type': `${type}; charset=utf-8` }); res.end(type === 'application/json' ? JSON.stringify(value) : value); };
  try {
    if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) return send(403, { error: 'Local access only.' });
    const path = new URL(req.url, `http://127.0.0.1:${port}`).pathname;
    if (req.method === 'GET' && path === '/api/health') return send(200, await models());
    if (req.method === 'POST' && path === '/api/analyze') {
      const origin = req.headers.origin;
      if (origin && ![`http://localhost:${port}`, `http://127.0.0.1:${port}`].includes(origin)) return send(403, { error: 'Cross-origin requests are blocked.' });
      if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Expected application/json.' });
      if (busy) return send(429, { error: 'One analysis is already running. Please wait for it to finish.' });
      let body = '';
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 150000) return send(413, { error: 'Request is too large.' }); }
      let input;
      try { input = JSON.parse(body); } catch { return send(400, { error: 'Invalid JSON.' }); }
      busy = true;
      try { return send(200, await analyze(input, input.model)); }
      catch (error) { return send(422, { error: error.name === 'TimeoutError' ? 'The model took too long. Try a shorter agreement or a smaller model.' : error.message }); }
      finally { busy = false; }
    }
    if (req.method === 'GET' && assets.has(path)) {
      const [file, type] = assets.get(path);
      return send(200, await readFile(fileURLToPath(new URL(`./public/${file}`, import.meta.url))), type);
    }
    send(404, { error: 'Not found.' });
  } catch { if (!res.headersSent) send(500, { error: 'Could not complete the local request.' }); }
});
server.requestTimeout = 300000;
server.listen(port, '127.0.0.1', () => console.log(`ScopeShield is ready: http://127.0.0.1:${port}\nPrivate by design. Documents stay in memory; AI requests go only to local Ollama.`));
