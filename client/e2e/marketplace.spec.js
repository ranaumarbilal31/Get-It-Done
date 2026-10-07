import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const login = async (page, role) => {
  await page.goto('/login');
  await page
    .getByLabel('Email address', { exact: true })
    .fill(
      { Admin: 'admin@getitdone.com', Poster: 'sarah@example.com', Tasker: 'alex@example.com' }[
        role
      ],
    );
  await page.getByLabel('Password', { exact: true }).fill('Password123!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(role === 'Admin' ? /\/admin$/ : /\/account$/);
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
      '/payments',
      '/dispute-policy',
      '/how-it-works',
      '/forgot-password',
      '/resend-verification',
      '/verify-email',
      '/reset-password',
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Get it done.');
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
test('registration, funding, hiring, delivery, chat, release and review', async ({ browser }) => {
  const posterContext = await browser.newContext(),
    taskerContext = await browser.newContext();
  const poster = await posterContext.newPage(),
    tasker = await taskerContext.newPage();
  const email = 'browser-' + Date.now() + '@example.com';
  await poster.goto('http://127.0.0.1:5173/register');
  await poster.getByLabel('Full name', { exact: true }).fill('Browser Poster');
  await poster.getByLabel('Email address', { exact: true }).fill(email);
  await poster.getByLabel('Password', { exact: true }).fill('Password123!');
  await poster.getByRole('button', { name: 'Create an account', exact: true }).click();
  await expect(poster.getByRole('status')).toContainText('Check your email');
  const mail = await (
    await poster.request.get('http://127.0.0.1:5000/__test/email?to=' + encodeURIComponent(email))
  ).json();
  await poster.goto('http://127.0.0.1:5173/verify-email#token=' + mail.at(-1).token);
  await poster.getByRole('button', { name: 'Activate account', exact: true }).click();
  await expect(poster.getByRole('status')).toContainText('activated');
  await poster.goto('http://127.0.0.1:5173/login');
  await poster.getByLabel('Email address', { exact: true }).fill(email);
  await poster.getByLabel('Password', { exact: true }).fill('Password123!');
  await poster.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(poster).toHaveURL(/\/account$/);
  await poster.goto('http://127.0.0.1:5173/post-task');
  await poster.getByLabel('Task title').fill('Browser remote development project');
  await poster.getByLabel('Task category').selectOption({ index: 1 });
  await poster.getByLabel('Budget in US dollars').fill('100');
  await poster
    .getByLabel('Task description')
    .fill('Please help build a remote project with documented delivery.');
  await poster.getByRole('button', { name: 'Review and fund task' }).click();
  await expect(poster.getByRole('dialog')).toContainText('$101.00');
  await poster.getByRole('button', { name: 'Confirm funding and publish' }).click();
  await expect(poster).toHaveURL(/\/tasks\/[^/?]+$/);
  const url = poster.url();
  await login(tasker, 'Tasker');
  await tasker.goto(url);
  await tasker.getByRole('button', { name: 'Make an offer', exact: true }).click();
  await tasker.getByLabel('Offer amount (USD)').fill('90');
  await tasker.getByLabel('Your proposal').fill('I can deliver the requested remote project.');
  await expect(tasker.getByRole('dialog')).toContainText('$85.44');
  await tasker.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(tasker.getByRole('status')).toContainText('submitted');
  await poster.reload();
  await poster.getByRole('button', { name: 'Choose tasker' }).click();
  await expect(poster.getByRole('dialog')).toContainText('$91.00');
  await poster.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(poster.getByRole('status')).toContainText('accepted');
  await tasker.goto(url + '?tab=chat');
  await tasker.getByLabel('Message', { exact: true }).fill('Hello from the hired tasker.');
  await tasker.getByRole('button', { name: 'Send message' }).click();
  await expect(tasker.getByText('Hello from the hired tasker.', { exact: true })).toHaveCount(1);
  await poster.goto(url + '?tab=chat');
  await expect(poster.getByText('Hello from the hired tasker.', { exact: true })).toBeVisible();
  await tasker.getByRole('button', { name: 'Deliver work', exact: true }).click();
  await tasker
    .getByLabel('Delivery notes')
    .fill('The project is complete and the handover notes are ready.');
  await tasker.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(tasker.getByRole('status')).toBeVisible();
  await poster.reload();
  await poster.getByRole('button', { name: 'Approve and release payment' }).click();
  await poster.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(poster.getByRole('status')).toBeVisible();
  await poster.getByRole('button', { name: 'Leave a review' }).click();
  await poster.getByLabel('Your feedback').fill('A useful result with a clear handover.');
  await poster.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(
    poster.getByText('A useful result with a clear handover.', { exact: true }),
  ).toBeVisible();
  await tasker.goto('http://127.0.0.1:5173/account');
  await expect(tasker.getByRole('cell', { name: '$85.44', exact: true })).toBeVisible();
  await posterContext.close();
  await taskerContext.close();
});

test('admin and account screens fit at all widths', async ({ page }) => {
  await login(page, 'Admin');
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/admin', '/profile', '/account', '/change-password']) {
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
  await expect(applicant.getByRole('status')).toContainText('Check your email');
  const mail = await (
    await applicant.request.get(
      'http://127.0.0.1:5000/__test/email?to=' +
        encodeURIComponent(
          await applicant.getByLabel('Email address', { exact: true }).inputValue(),
        ),
    )
  ).json();
  await applicant.goto('http://127.0.0.1:5173/verify-email#token=' + mail.at(-1).token);
  await applicant.getByRole('button', { name: 'Activate account', exact: true }).click();
  await expect(applicant.getByRole('status')).toContainText('activated');
  await applicant.goto('http://127.0.0.1:5173/login');
  await applicant.getByLabel('Email address', { exact: true }).fill(mail.at(-1).to);
  await applicant.getByLabel('Password', { exact: true }).fill('Password123!');
  await applicant.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(applicant).toHaveURL(/\/account$/);
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

test('public presentation has no repository links or development labels', async ({
  page,
  request,
}) => {
  for (const route of [
    '/',
    '/about',
    '/faq',
    '/payments',
    '/terms',
    '/privacy',
    '/trust-safety',
    '/dispute-policy',
    '/login',
    '/register',
  ]) {
    await page.goto(route);
    expect(await page.locator('body').innerText()).not.toMatch(
      /demo|demonstration|test site|under development|simulated/i,
    );
    await expect(page.locator('a[href*="github.com"]')).toHaveCount(0);
  }
  for (const asset of [
    '/favicon.svg',
    '/favicon.ico',
    '/favicon-32.png',
    '/apple-touch-icon.png',
    '/fonts/fira-sans-latin-400-normal.woff2',
  ])
    expect((await request.get(asset)).status()).toBe(200);
});

test('password recovery links work and invalidate the previous session', async ({
  page,
  request,
}) => {
  await login(page, 'Tasker');
  const original = (
    await request.post('/api/auth/login', {
      data: { email: 'alex@example.com', password: 'Password123!' },
    })
  ).json();
  await page.goto('/forgot-password');
  await page.getByLabel('Email address', { exact: true }).fill('alex@example.com');
  await page.getByRole('button', { name: 'Send email', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('request has been recorded');
  const emails = await (
    await request.get('http://127.0.0.1:5000/__test/email?to=alex%40example.com')
  ).json();
  await page.goto('/reset-password#token=' + emails.at(-1).token);
  await page.getByLabel('New password', { exact: true }).fill('ReplacedPassword123!');
  await page.getByRole('button', { name: 'Save password', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Password updated');
  expect(
    (
      await request.get('/api/auth/me', {
        headers: { Authorization: 'Bearer ' + (await original).token },
      })
    ).status(),
  ).toBe(401);
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill('alex@example.com');
  await page.getByLabel('Password', { exact: true }).fill('ReplacedPassword123!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  // Restore fixture credentials for later tests while exercising authenticated password change.
  await page.goto('/change-password');
  await page.getByLabel('Current password').fill('ReplacedPassword123!');
  await page.getByLabel('New password').fill('Password123!');
  await page.getByRole('button', { name: 'Save password', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Password updated');
});

test('admin reviews both sides and settles a disputed task', async ({ browser, request }) => {
  const auth = async (email) =>
    (
      await (
        await request.post('/api/auth/login', { data: { email, password: 'Password123!' } })
      ).json()
    ).token;
  const poster = await auth('sarah@example.com'),
    tasker = await auth('alex@example.com'),
    category = (await (await request.get('/api/categories')).json()).categories[0].id;
  const call = async (token, path, data) =>
    await (
      await request.post('/api/' + path, { headers: { Authorization: 'Bearer ' + token }, data })
    ).json();
  const task = (
    await call(poster, 'tasks', {
      title: 'Disputed browser delivery',
      description: 'A focused project with agreed acceptance criteria.',
      budget: 10,
      categoryId: category,
      isRemote: true,
    })
  ).task;
  await call(poster, 'payments/tasks/' + task.id + '/fund', { confirmPreview: true });
  const offer = (
    await call(tasker, 'offers/task/' + task.id, {
      amount: 10,
      message: 'I will deliver the agreed outcome.',
    })
  ).offer;
  await call(poster, 'offers/' + offer.id + '/accept', { confirmPreview: true });
  await call(tasker, 'payments/tasks/' + task.id + '/deliver', {
    notes: 'The agreed project has been delivered for review.',
  });
  await call(poster, 'payments/tasks/' + task.id + '/dispute', {
    reason: 'The jobber believes part of the agreed delivery is missing.',
  });
  await call(tasker, 'payments/tasks/' + task.id + '/evidence', {
    content: 'The tasker has supplied delivery notes documenting the completed work.',
  });
  const context = await browser.newContext(),
    page = await context.newPage();
  await login(page, 'Admin');
  await page.getByLabel('Payment status').selectOption('DISPUTED');
  await page
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name: 'Disputed browser delivery', exact: true }) })
    .getByRole('button', { name: 'Review dispute' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('The tasker has supplied delivery notes');
  await page.getByLabel('Outcome').selectOption('SPLIT');
  await page.getByLabel('Task amount awarded (USD)').fill('5');
  await page
    .getByLabel('Written decision')
    .fill('The evidence supports awarding half of the task amount.');
  await page.getByRole('button', { name: 'Record decision and settle' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const paid = await request.get('/api/tasks/' + task.id, {
    headers: { Authorization: 'Bearer ' + poster },
  });
  const data = (await paid.json()).task;
  expect(data.status).toBe('COMPLETED');
  expect(data.payment.taskerNetCents).toBe(392);
  expect(data.dispute.decision).toContain('awarding half');
  await context.close();
});
