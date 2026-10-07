import fs from 'node:fs/promises';
import { render } from '../dist/server/entry-server.js';
const template = await fs.readFile('dist/client/index.html', 'utf8');
for (const route of ['/about', '/trust-safety', '/faq', '/contact', '/terms', '/privacy']) {
  const result = await render(route, template, 'http://localhost:5000');
  await fs.mkdir(`dist/client${route}`, { recursive: true });
  const html =
    process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
      ? result.html.replace('content="index,follow"', 'content="noindex,follow"')
      : result.html;
  await fs.writeFile(`dist/client${route}/index.html`, html);
}
await fs.rename('dist/client/index.html', 'dist/client/template.html');
