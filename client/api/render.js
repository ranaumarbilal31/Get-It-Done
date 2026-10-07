import fs from 'node:fs/promises';
import { render } from '../dist/server/entry-server.js';
export default async function handler(req, res) {
  try {
    const query = new URL(req.url, 'https://get-it-done-steel.vercel.app');
    const path = query.searchParams.get('path') || '';
    query.searchParams.delete('path');
    const url = '/' + path + (query.searchParams.size ? '?' + query.searchParams.toString() : '');
    if (path && path.endsWith('/')) {
      res.writeHead(301, { Location: url.replace(/\/(?=\?|$)/, '') });
      res.end();
      return;
    }
    const template = await fs.readFile(
      new URL('../dist/client/template.html', import.meta.url),
      'utf8',
    );
    const result = await render(
      url,
      template,
      process.env.API_ORIGIN || 'https://taskconnect-api.onrender.com',
    );
    res.writeHead(result.status, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag':
        process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' ? 'noindex' : 'all',
    });
    res.end(result.html);
  } catch (error) {
    console.error('SSR failed:', error.message);
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<h1>Temporarily unavailable</h1><p>Please try again.</p>');
  }
}
