import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
const children = [
  spawn(process.execPath, ['../server/scripts/test-server.cjs'], { stdio: 'ignore' }),
  spawn(process.execPath, ['ssr-server.js', '--production'], {
    stdio: 'ignore',
    env: { ...process.env, API_ORIGIN: 'http://127.0.0.1:5000' },
  }),
];
let chrome;
try {
  for (const url of ['http://127.0.0.1:5000/api/health', 'http://127.0.0.1:5173/about']) {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        ready = (await fetch(url)).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error('Test server did not start: ' + url);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto('http://127.0.0.1:5173/social-card.svg');
  await page.locator('svg').screenshot({ path: 'public/social-card.png' });
  await browser.close();
  chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  const result = await lighthouse('http://127.0.0.1:5173/', {
    port: chrome.port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  await fs.mkdir('reports', { recursive: true });
  await fs.writeFile('reports/lighthouse.json', result.report);
  console.log(
    JSON.stringify(
      {
        mode: 'Local production build, simulated mobile throttling',
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]),
        ),
        LCP: result.lhr.audits['largest-contentful-paint'].numericValue,
        CLS: result.lhr.audits['cumulative-layout-shift'].numericValue,
        TBT: result.lhr.audits['total-blocking-time'].numericValue,
        failedAudits: Object.values(result.lhr.audits)
          .filter((a) => a.score !== null && a.score < 1)
          .map((a) => ({ id: a.id, title: a.title, displayValue: a.displayValue })),
      },
      null,
      2,
    ),
  );
} finally {
  await chrome?.kill();
  children.forEach((child) => child.kill());
}
