// dev-server.mjs — 本地预览（静态 + /api/telemetry），仅开发用
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 8899;
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8'
};

const json = (o) => JSON.stringify(o);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/telemetry') {
    const now = Date.now();
    const d = new Date(now), f = new Date(now);
    f.setFullYear(d.getFullYear() + 25);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(json({ now, fictionNow: f.getTime(), node: 'EOB-01', tz: 'UTC' }));
  }
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(normalize(ROOT))) { res.writeHead(403); return res.end('forbidden'); }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not file');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`WCA-ENG dev server → http://127.0.0.1:${PORT}`);
});
