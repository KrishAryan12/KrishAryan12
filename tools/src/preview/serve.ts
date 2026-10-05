/**
 * Local preview: http://localhost:4173/ (light) and /dark, approximating GitHub's README rendering.
 * Resize the window to 375 / 768 / 880 px to check mobile and desktop. github.com is the authority.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { ROOT } from '../lib/paths.ts';
import { previewHtml } from './render.ts';

const TYPES: Record<string, string> = { '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.gif': 'image/gif', '.json': 'application/json' };
const PORT = Number(process.env.PORT ?? 4173);

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  if (url.pathname === '/' || url.pathname === '/dark') {
    const theme = url.pathname === '/dark' ? 'dark' : 'light';
    // Serve over http, so asset paths resolve against the server instead of file://.
    const html = previewHtml(theme).replace(/<base href="[^"]*">/, '<base href="/">');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
    return;
  }
  const file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
}).listen(PORT, () => console.log(`preview: http://localhost:${PORT}/ (light) · http://localhost:${PORT}/dark`));
