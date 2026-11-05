const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const webRoot = path.join(root, 'web');
const port = Number(process.env.PORT) || 3000;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const file = path.normalize(path.join(webRoot, requestPath));
  if (!file.startsWith(`${webRoot}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store, max-age=0, must-revalidate' });
    res.end('页面不存在');
    return;
  }
  res.writeHead(200, {
    'Content-Type': types[path.extname(file)] || 'application/octet-stream',
    'Cache-Control':'no-store, max-age=0, must-revalidate'
  });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`WareBoss local server running at http://localhost:${port}`));
