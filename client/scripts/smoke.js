import fs from 'node:fs/promises';
const origin = process.argv[2] || 'https://get-it-done-steel.vercel.app';
const canonicalOrigin = 'https://get-it-done-steel.vercel.app';
const routes = ['/', '/tasks', '/about', '/trust-safety', '/faq', '/contact', '/terms', '/privacy'];
const findings = [];
const failures = [];
const get = async (path) => {
  const response = await fetch(origin + path, { signal: AbortSignal.timeout(45000) });
  return { response, body: await response.text() };
};
for (const route of routes) {
  const { response, body } = await get(route);
  const canonical = body.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
  const h1s = (body.match(/<h1(?:\s|>)/g) || []).length;
  findings.push({
    route,
    status: response.status,
    canonical,
    h1s,
    initialContent: body.includes('Get It Done'),
  });
  if (response.status !== 200 || canonical !== canonicalOrigin + route || h1s !== 1)
    failures.push(route);
  if (route === '/tasks') {
    const task = body.match(/href="(\/tasks\/[^"?]+)"/)?.[1];
    if (task) {
      const detail = await get(task);
      findings.push({
        route: task,
        status: detail.response.status,
        initialContent: /<h1(?:\s|>)/.test(detail.body),
      });
      if (detail.response.status !== 200 || !/<h1(?:\s|>)/.test(detail.body)) failures.push(task);
    }
  }
}
for (const path of [
  '/missing-smoke-check',
  '/tasks/missing-smoke-check',
  '/users/missing-smoke-check',
]) {
  const { response } = await get(path);
  findings.push({ route: path, status: response.status });
  if (response.status !== 404) failures.push(path);
}
const xml = await get('/sitemap.xml');
const urls = [...xml.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
findings.push({ route: '/sitemap.xml', status: xml.response.status, URLs: urls.length });
if (
  xml.response.status !== 200 ||
  !urls.length ||
  urls.some(
    (url) =>
      !url.startsWith(canonicalOrigin + '/') ||
      /\/(profile|users|admin|login|register|post-task)(?:\/|$)/.test(url),
  )
)
  failures.push('/sitemap.xml');
const robots = await get('/robots.txt');
if (
  robots.response.status !== 200 ||
  !robots.body.includes('Sitemap: ' + canonicalOrigin + '/sitemap.xml')
)
  failures.push('/robots.txt');
const filtered = await get('/tasks?search=clean');
if (
  !filtered.body.includes('noindex,follow') ||
  !filtered.body.includes(`href="${canonicalOrigin}/tasks"`)
)
  failures.push('filtered canonical/noindex');
const report = { checkedAt: new Date().toISOString(), origin, findings, failures };
await fs.mkdir('reports', { recursive: true });
await fs.writeFile('reports/production-smoke.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
