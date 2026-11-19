// Local dev server: serves the site and accepts studio renders at POST /save?name=x (writes assets/x.webp).
// Usage: node tools/serve.js   then open http://localhost:5177/tools/studio.html
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x');
  if (q.method === 'POST' && u.pathname === '/save') {
    const name = (u.searchParams.get('name') || '').replace(/[^a-z0-9-]/gi, ''); // only safe file names
    let body = ''; q.on('data', d => body += d);
    q.on('end', () => {
      const m = body.match(/^data:image\/webp;base64,(.+)$/);
      if (!name || !m) { r.writeHead(400); return r.end('bad'); }
      fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
      fs.writeFileSync(path.join(root, 'assets', name + '.webp'), Buffer.from(m[1], 'base64'));
      r.writeHead(200); r.end('ok');
    });
    return;
  }
  const file = path.join(root, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!file.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.readFile(file, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); r.end(d); });
}).listen(5177, () => console.log('http://localhost:5177'));
