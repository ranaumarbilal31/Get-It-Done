import { describe, it, expect, vi, afterEach } from 'vitest';
import { metadata, loadRouteData, staticRoutes } from '../src/routeData';
import { sitemap } from '../sitemap';
afterEach(() => vi.unstubAllGlobals());
describe('SEO and public data boundaries', () => {
  it('provides unique, indexable metadata for core pages', () => {
    const paths = ['/', '/tasks', ...staticRoutes];
    const metas = paths.map((p) => metadata(p));
    expect(new Set(metas.map((m) => m.title)).size).toBe(paths.length);
    expect(new Set(metas.map((m) => m.description)).size).toBe(paths.length);
    metas.forEach((m) => {
      expect(m.noindex).toBe(false);
      expect(m.canonical).toMatch(/^https:\/\/get-it-done-steel\.vercel\.app\//);
      expect(m.description.length).toBeGreaterThanOrEqual(120);
      expect(m.description.length).toBeLessThanOrEqual(160);
    });
  });
  it('noindexes utility, search, closed and missing pages', () => {
    for (const path of [
      '/login',
      '/register',
      '/profile',
      '/admin',
      '/post-task',
      '/users/abc',
      '/tasks?search=clean',
    ])
      expect(metadata(path).noindex).toBe(true);
    expect(metadata('/tasks/abc', { task: { title: 'Test', status: 'COMPLETED' } }).noindex).toBe(
      true,
    );
    expect(metadata('/tasks/abc', { task: { title: 'Test', status: 'OPEN' } }).noindex).toBe(false);
    expect(metadata('/missing', { status: 404 }).noindex).toBe(true);
    expect(metadata('/tasks?category=home-cleaning').canonical).toBe(
      'https://get-it-done-steel.vercel.app/tasks',
    );
  });
  it('serializes task content without payment or offers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          task: {
            id: 'a',
            title: 'Help',
            status: 'OPEN',
            offers: [{ private: 'secret' }],
            payment: { amount: 42 },
            poster: { id: 'public', name: 'Person' },
          },
        }),
      })),
    );
    const data = await loadRouteData('/tasks/a', 'http://api');
    expect(data.task.offers).toBeUndefined();
    expect(data.task.payment).toBeUndefined();
    expect(data.task.title).toBe('Help');
  });
  it('distinguishes 404 and temporary backend failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404 })),
    );
    expect((await loadRouteData('/tasks/missing', 'http://api')).status).toBe(404);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500 })),
    );
    expect((await loadRouteData('/tasks', 'http://api')).status).toBe(503);
    expect((await loadRouteData('/missing', 'http://api')).status).toBe(404);
  });
  it('builds a sitemap with open tasks and no utility URLs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ tasks: [{ id: 'open-task' }], pagination: { pages: 1 } }),
      })),
    );
    const result = await sitemap('/sitemap.xml', 'http://api');
    expect(result.status).toBe(200);
    expect(result.body).toContain('/tasks/open-task');
    expect(result.body).not.toContain('/post-task');
    expect(result.body).not.toContain('/users/');
  });
});
