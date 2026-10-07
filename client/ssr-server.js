import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createServer } from 'vite';
import { sitemap } from './sitemap.js';
const production = process.argv.includes('--production');
const vite = production
  ? null
  : await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const origin = process.env.API_ORIGIN || 'http://localhost:5000';
const server = http.createServer(async (req, res) => {
  const send = (body) => {
    if (production && req.headers['accept-encoding']?.includes('gzip')) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      res.end(gzipSync(body));
    } else res.end(body);
  };
  const serve = async () => {
    try {
      if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
        const proxy = await fetch(origin + req.url, {
          method: req.method,
          headers: { ...req.headers, host: new URL(origin).host },
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
          duplex: 'half',
        });
        res.writeHead(
          proxy.status,
          Object.fromEntries(
            [...proxy.headers].filter(
              ([key]) => !['content-encoding', 'content-length', 'transfer-encoding'].includes(key),
            ),
          ),
        );
        res.end(Buffer.from(await proxy.arrayBuffer()));
        return;
      }
      if (/^\/sitemap(?:-\d+)?\.xml(?:\?|$)/.test(req.url)) {
        const result = await sitemap(req.url, origin);
        res.writeHead(result.status, { 'Content-Type': 'application/xml' });
        res.end(result.body);
        return;
      }
      if (production && path.extname(new URL(req.url, 'http://localhost').pathname)) {
        const file = path.resolve(
          'dist/client',
          '.' + new URL(req.url, 'http://localhost').pathname,
        );
        if (!file.startsWith(path.resolve('dist/client') + path.sep)) {
          res.writeHead(404);
          res.end();
          return;
        }
        try {
          const body = await fs.readFile(file);
          res.setHeader(
            'Content-Type',
            {
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.txt': 'text/plain',
              '.ico': 'image/x-icon',
            }[path.extname(file)] || 'application/octet-stream',
          );
          res.setHeader(
            'Cache-Control',
            file.includes(path.sep + 'assets' + path.sep) ||
              file.includes(path.sep + 'fonts' + path.sep)
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=3600',
          );
          send(body);
          return;
        } catch {
          res.writeHead(404);
          res.end();
          return;
        }
      }
      let template = await fs.readFile(
        production ? 'dist/client/template.html' : 'index.html',
        'utf8',
      );
      if (vite) template = await vite.transformIndexHtml(req.url, template);
      const { render } = production
        ? await import('./dist/server/entry-server.js')
        : await vite.ssrLoadModule('/src/entry-server.jsx');
      const result = await render(req.url, template, origin);
      res.statusCode = result.status;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      send(result.html);
    } catch (error) {
      vite?.ssrFixStacktrace(error);
      console.error(error);
      res.writeHead(500);
      res.end('Unable to render this page.');
    }
  };
  if (vite) vite.middlewares(req, res, serve);
  else await serve();
});
server.listen(Number(process.env.PORT || 5173), '127.0.0.1', () =>
  console.log('Get It Done SSR ready'),
);
