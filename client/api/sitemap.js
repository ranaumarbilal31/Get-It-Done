import { sitemap } from '../sitemap.js';
export default async function handler(req, res) {
  const url = new URL(req.url, 'https://get-it-done-steel.vercel.app');
  const path = url.searchParams.get('path') || 'sitemap.xml';
  const result = await sitemap(
    '/' + path,
    process.env.API_ORIGIN || 'https://taskconnect-api.onrender.com',
  );
  res.writeHead(result.status, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(result.body);
}
