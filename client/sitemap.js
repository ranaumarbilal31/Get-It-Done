const SITE = 'https://get-it-done-steel.vercel.app';
const pages = ['/', '/tasks', '/about', '/trust-safety', '/faq', '/contact', '/terms', '/privacy'];
let cache;
let cacheTime = 0;
const xmlEscape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export async function sitemap(rawUrl, origin) {
  try {
    if (!cache || Date.now() - cacheTime > 60000) {
      const urls = [...pages];
      let page = 1,
        totalPages = 1;
      do {
        const response = await fetch(`${origin}/api/tasks?status=OPEN&limit=100&page=${page}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error('Catalog unavailable');
        const data = await response.json();
        for (const task of data.tasks) urls.push('/tasks/' + encodeURIComponent(task.id));
        totalPages = data.pagination?.pages || 1;
        page++;
      } while (page <= totalPages);
      cache = [];
      let chunk = [],
        size = 200;
      for (const url of new Set(urls)) {
        const entry = `<url><loc>${xmlEscape(SITE + url)}</loc></url>`;
        if (chunk.length >= 50000 || size + Buffer.byteLength(entry) > 49 * 1024 * 1024) {
          cache.push(chunk);
          chunk = [];
          size = 200;
        }
        chunk.push(entry);
        size += Buffer.byteLength(entry);
      }
      cache.push(chunk);
      cacheTime = Date.now();
    }
    const match = new URL(rawUrl, SITE).pathname.match(/^\/sitemap-(\d+)\.xml$/);
    if (match || cache.length === 1) {
      const chunk = cache[match ? Number(match[1]) - 1 : 0];
      if (!chunk) return { status: 404, body: '<error>Not found</error>' };
      return {
        status: 200,
        body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${chunk.join('')}</urlset>`,
      };
    }
    return {
      status: 200,
      body: `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${cache.map((_, i) => `<sitemap><loc>${SITE}/sitemap-${i + 1}.xml</loc></sitemap>`).join('')}</sitemapindex>`,
    };
  } catch {
    return { status: 503, body: '<error>Catalog temporarily unavailable</error>' };
  }
}
