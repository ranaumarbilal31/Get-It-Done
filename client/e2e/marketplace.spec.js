import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const login = async (page, role) => {
  await page.goto('/login');
  await page.getByRole('button', { name: role, exact: true }).click();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(role === 'Admin' ? /\/admin$/ : /\/tasks$/);
};
for (const width of [375, 768, 1440]) {
  test(`all public screens fit and render at ${width}px`, async ({ page, request }) => {
    const listing = (await (await request.get('/api/tasks')).json()).tasks[0];
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const routes = [
      '/',
      '/tasks',
      '/post-task',
      '/login',
      '/register',
      '/about',
      '/trust-safety',
      '/faq',
      '/contact',
      '/terms',
      '/privacy',
      '/missing',
      '/tasks/' + listing.id,
      '/users/' + listing.poster.id,
      '/users/missing',
    ];
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response.status()).toBe(route.endsWith('/missing') ? 404 : 200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        )
        .toBe(true);
      expect(await page.locator('link[rel=canonical]').getAttribute('href')).toBe(
        'https://get-it-done-steel.vercel.app' + (route === '/' ? '/' : route),
      );
      await page.screenshot({
        path: `test-results/screens/${width}-${route.replaceAll('/', '') || 'home'}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}
test('critical public content is available without JavaScript', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A little help.');
  await expect(page.locator('.category-card')).toHaveCount(6);
  await page.goto('http://127.0.0.1:5173/tasks');
  await expect(page.locator('.task-card').first()).toBeVisible();
  const href = await page.locator('.task-card').first().getAttribute('href');
  await page.goto('http://127.0.0.1:5173' + href);
  await expect(page.locator('h1')).toHaveCount(1);
  const missing = await request.get('/tasks/missing');
  expect(missing.status()).toBe(404);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<urlset');
  expect(await sitemap.text()).not.toContain('/post-task');
  await context.close();
});
test('filters synchronize with URLs, history, and invalid ranges', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByLabel('Category', { exact: true }).selectOption('home-cleaning');
  await expect(page).toHaveURL(/category=home-cleaning/);
  await page.getByLabel('Location', { exact: true }).selectOption('true');
  await expect(page).toHaveURL(/isRemote=true/);
  await page.goBack();
  await expect(page.getByLabel('Location', { exact: true })).toHaveValue('');
  await page.getByLabel('Min budget ($)').fill('200');
  await page.getByLabel('Max budget ($)').fill('20');
  await expect(page.getByRole('alert')).toContainText('Minimum budget');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.locator('.task-card').first()).toBeVisible();
});
test('profile loads the requested user and session expiry clears auth', async ({
  page,
  request,
}) => {
  const tasks = (await (await request.get('/api/tasks')).json()).tasks;
  await login(page, 'Tasker');
  await page.goto('/users/' + tasks[0].poster.id);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(tasks[0].poster.name);
  await expect(page.getByText('Demo Wallet Balance')).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem('getitdone_token', 'expired'));
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('getitdone_token'))).toBeNull();
});
test('registration, posting, offer, acceptance, chat, completion and review', async ({
  browser,
}) => {
  const posterContext = await browser.newContext(),
    taskerContext = await browser.newContext();
  const poster = await posterContext.newPage(),
    tasker = await taskerContext.newPage();
  await poster.goto('http://127.0.0.1:5173/register');
  await poster.getByLabel('Full name', { exact: true }).fill('Browser Test Poster');
  await poster
    .getByLabel('Email address', { exact: true })
    .fill('browser-' + Date.now() + '@example.com');
  await poster.getByLabel('Password', { exact: true }).fill('Password123!');
  await poster.getByRole('button', { name: 'Create an account', exact: true }).click();
  await expect(poster).toHaveURL(/\/tasks$/);
  await poster.goto('http://127.0.0.1:5173/post-task');
  await poster.getByLabel('Task title').fill('Browser regression remote task');
  await poster.getByLabel('Budget in US dollars').fill('100');
  await poster.getByRole('button', { name: 'Online / Remote' }).click();
  await poster
    .getByLabel('Task description')
    .fill('Please help with a remote project for browser regression verification.');
  await poster.getByRole('button', { name: 'Publish Task Listing' }).click();
  await expect(poster).toHaveURL(/\/tasks\/[^/?]+$/);
  const url = poster.url();
  await login(tasker, 'Tasker');
  await tasker.goto(url);
  await tasker
    .getByRole('button', { name: /make.*offer|submit.*offer/i })
    .first()
    .click();
  await tasker.getByLabel('Offer amount').fill('90');
  await tasker.getByLabel('Offer proposal').fill('I can help with this remote project.');
  await tasker
    .getByRole('dialog')
    .getByRole('button', { name: /submit offer/i })
    .click();
  await expect(tasker.getByText('Your offer has been submitted successfully!')).toBeVisible();
  await poster.reload();
  await poster
    .getByRole('button', { name: /accept.*offer/i })
    .first()
    .click();
  await poster
    .getByRole('button', { name: /confirm demo hold/i })
    .last()
    .click();
  await expect(
    poster.getByText('Offer accepted. A simulated payment hold has been recorded.'),
  ).toBeVisible();
  await tasker.goto(url + '?tab=chat');
  await expect(tasker.getByLabel('Message', { exact: true })).toBeVisible();
  await tasker.getByLabel('Message', { exact: true }).fill('Hello from the hired tasker.');
  await tasker.getByRole('button', { name: 'Send message' }).click();
  await expect(tasker.getByText('Hello from the hired tasker.', { exact: true })).toHaveCount(1);
  await poster.goto(url + '?tab=chat');
  await expect(poster.getByText('Hello from the hired tasker.', { exact: true })).toBeVisible();
  await poster.goto(url);
  poster.on('dialog', (dialog) => dialog.accept());
  await poster.getByRole('button', { name: /mark.*complete/i }).click();
  await expect(
    poster.getByText('Task completed. A simulated payout has been recorded.'),
  ).toBeVisible();
  await poster.getByLabel('Review comment').fill('Completed the remote project successfully.');
  await poster.getByRole('button', { name: /post.*review/i }).click();
  await expect(
    poster.getByText('Thank you! Your review and rating have been posted.'),
  ).toBeVisible();
  await posterContext.close();
  await taskerContext.close();
});
test('admin and account screens fit at all widths', async ({ page }) => {
  await login(page, 'Admin');
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/admin', '/profile']) {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/screens/${width}-${route.slice(1)}.png`,
        fullPage: true,
      });
    }
  }
});
test('public pages meet automated accessibility checks', async ({ page }) => {
  for (const route of [
    '/',
    '/tasks',
    '/post-task',
    '/login',
    '/register',
    '/about',
    '/faq',
    '/contact',
  ]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  }
});
test('identity sample submission and administrative inspection', async ({ browser }) => {
  const applicantContext = await browser.newContext(),
    adminContext = await browser.newContext();
  const applicant = await applicantContext.newPage(),
    admin = await adminContext.newPage();
  const name = 'Sample Applicant ' + Date.now();
  await applicant.goto('http://127.0.0.1:5173/register');
  await applicant.getByLabel('Full name', { exact: true }).fill(name);
  await applicant
    .getByLabel('Email address', { exact: true })
    .fill('sample-' + Date.now() + '@example.com');
  await applicant.getByLabel('Password', { exact: true }).fill('Password123!');
  await applicant.getByRole('button', { name: 'Create an account', exact: true }).click();
  await expect(applicant).toHaveURL(/\/tasks$/);
  await applicant.goto('http://127.0.0.1:5173/profile');
  await applicant.getByRole('button', { name: 'Get Verified' }).click();
  await applicant.getByLabel('Upload a file').setInputFiles({
    name: 'sample.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/q8AAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await applicant.getByRole('button', { name: 'Submit for Review' }).click();
  await expect(applicant.getByText('ID submitted for Admin Verification Review!')).toBeVisible();
  await login(admin, 'Admin');
  const card = admin
    .locator('[data-verification-user]')
    .filter({ has: admin.getByText(name, { exact: true }) })
    .first();
  await card.getByRole('button', { name: 'View Uploaded ID' }).click();
  await expect(
    admin.getByRole('dialog').getByRole('img', { name: 'Verification Document' }),
  ).toBeVisible();
  await admin.getByRole('button', { name: 'Close Preview' }).click();
  await card.getByRole('button', { name: 'Approve ID' }).click();
  await expect(admin.getByText('User verification updated to APPROVED!')).toBeVisible();
  await applicant.reload();
  await expect(applicant.getByText('Identity Verified', { exact: true })).toBeVisible();
  await applicantContext.close();
  await adminContext.close();
});
test('failed task requests show retry and recover', async ({ page }) => {
  await page.goto('/tasks');
  await page.route('**/api/tasks?**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Test outage' }),
    }),
  );
  await page.getByLabel('Search tasks').fill('repair');
  await expect(page.getByRole('alert')).toContainText('Test outage');
  await page.unroute('**/api/tasks?**');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('rapid duplicate registration submits send only one request', async ({ page }) => {
  let count = 0;
  await page.goto('/register');
  await page.route('**/api/auth/register', async (route) => {
    count++;
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: '{"message":"Test validation"}',
    });
  });
  await page.getByLabel('Full name', { exact: true }).fill('Duplicate Test');
  await page.getByLabel('Email address', { exact: true }).fill('duplicate@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Password123!');
  await page.locator('form').evaluate((form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole('alert')).toContainText('Test validation');
  expect(count).toBe(1);
});

test('latest filter response wins when requests finish out of order', async ({ page }) => {
  await page.goto('/tasks');
  const fulfill = (route, title) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tasks: [
          {
            id: title,
            title,
            description: 'Regression task',
            budget: 50,
            status: 'OPEN',
            isRemote: true,
            category: { name: 'Test' },
          },
        ],
        pagination: { page: 1, pages: 1, total: 1 },
      }),
    });
  await page.route('**/api/tasks?**', async (route) => {
    const search = new URL(route.request().url()).searchParams.get('search');
    if (search === 'older') {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      try {
        await fulfill(route, 'Older result');
      } catch {}
    } else await fulfill(route, 'Latest result');
  });
  await page.getByLabel('Search tasks').fill('older');
  await expect(page).toHaveURL(/search=older/);
  await page.getByLabel('Search tasks').fill('latest');
  await expect(page.getByText('Latest result', { exact: true })).toBeVisible();
  await page.waitForTimeout(1300);
  await expect(page.getByText('Older result', { exact: true })).toHaveCount(0);
});
test('non-admin account is denied administration and dialog focus stays inside', async ({
  page,
}) => {
  await login(page, 'Tasker');
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
