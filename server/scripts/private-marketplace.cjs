// Explicitly isolated synthetic activity. Never targets an operator-provided database.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../.private-staging');
fs.mkdirSync(root, { recursive: true });
process.env.NODE_ENV = 'test';
process.env.EMAIL_TRANSPORT = 'capture';
process.env.DATABASE_URL = 'file:../../.private-staging/marketplace.db';
if (!fs.existsSync(path.join(root, 'marketplace.db')))
  fs.writeFileSync(path.join(root, 'marketplace.db'), '');
process.env.JWT_SECRET =
  'private-staging-' + crypto.createHash('sha256').update(root).digest('hex');
process.env.PUBLIC_SITE_URL = 'http://127.0.0.1:5173';
if (process.env.DATABASE_URL !== 'file:../../.private-staging/marketplace.db')
  throw new Error('Unsafe staging target');
const cwd = path.resolve(__dirname, '..');
for (const args of [['generate'], ['db', 'push', '--skip-generate']]) {
  const r = spawnSync(
    process.execPath,
    [path.join(cwd, 'node_modules/prisma/build/index.js'), ...args],
    { cwd, env: process.env, stdio: 'inherit' },
  );
  if (r.status) process.exit(r.status);
}
async function main() {
  const prisma = require('../src/config/prisma');
  if (process.argv.includes('--serve')) {
    const { server } = require('../src/server');
    server.listen(5000, '127.0.0.1');
    console.log('Private marketplace API: http://127.0.0.1:5000');
    return;
  }
  const request = require('supertest');
  const { app } = require('../src/server');
  const { captures } = require('../src/services/accountEmail');
  const rosterPath = path.join(root, 'accounts.json');
  if (fs.existsSync(rosterPath)) {
    console.log(
      'Existing private dataset retained:',
      await prisma.task.count(),
      'tasks. Credentials:',
      path.join(root, 'accounts.md'),
    );
    await prisma.$disconnect();
    return;
  }
  if (await prisma.user.count())
    throw new Error(
      'Incomplete staging setup exists. Inspect it before rebuilding; existing records are not deleted.',
    );
  const specialties = [
    'React development',
    'WordPress websites',
    'Mobile development',
    'UI and UX design',
    'Quality assurance',
    'Cloud and DevOps',
    'Data analysis',
    'Technical SEO',
    'IT support',
    'API integrations',
    'Shopify development',
    'Accessibility audits',
    'Database design',
    'Cybersecurity review',
    'Automation',
  ];
  const names = [
    'Ayesha Khan',
    'Daniel Brooks',
    'Meera Patel',
    'Omar Farooq',
    'Sofia Reyes',
    'Ethan Clarke',
    'Nadia Hassan',
    'Lucas Meyer',
    'Priya Shah',
    'Adam Bennett',
    'Hana Malik',
    'Leo Martin',
    'Sara Ahmed',
    'Noah Wilson',
    'Zara Ali',
    'Maya Collins',
    'Arjun Mehta',
    'Grace Turner',
    'Bilal Rahman',
    'Ella Parker',
    'Rohan Das',
    'Chloe Harris',
    'Imran Aziz',
    'Amelia Scott',
    'Samir Iqbal',
  ];
  const category = await prisma.category.create({
    data: {
      name: 'Tech & Digital',
      slug: 'tech-digital',
      icon: 'Laptop',
      description: 'Websites, software, design and technical support',
    },
  });
  const accounts = [];
  const post = async (token, endpoint, body) => {
    const r = await request(app)
      .post('/api/' + endpoint)
      .set('Authorization', 'Bearer ' + token)
      .send(body);
    if (r.status >= 400) throw new Error(endpoint + ': ' + r.status + ' ' + r.body.message);
    return r.body;
  };
  for (let i = 0; i < 25; i++) {
    const email = `${i < 15 ? 'tasker' : 'jobber'}${i < 15 ? i + 1 : i - 14}@private.example`,
      password = crypto.randomBytes(15).toString('base64url') + '!9a';
    await post('', 'auth/register', { name: names[i], email, password });
    await post('', 'auth/verify-email', {
      token: captures.filter((m) => m.to === email).at(-1).token,
    });
    const auth = await post('', 'auth/login', { email, password });
    const specialty = i < 15 ? specialties[i] : 'Small business projects';
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        bio:
          i < 15
            ? `${specialty} specialist. I work from clear briefs, share progress and document delivery so clients can review the result.`
            : 'I run a small business and hire specialists for focused digital projects. Clear communication and practical outcomes matter to me.',
      },
    });
    accounts.push({
      name: names[i],
      email,
      password,
      role: i < 15 ? 'Tasker' : 'Jobber',
      specialty,
      id: auth.user.id,
      token: auth.token,
    });
  }
  const adminPassword = crypto.randomBytes(18).toString('base64url') + '!9a';
  const admin = await prisma.user.create({
    data: {
      name: 'Marketplace Administrator',
      email: 'admin@private.example',
      password: await require('bcryptjs').hash(adminPassword, 10),
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  const adminAuth = await post('', 'auth/login', { email: admin.email, password: adminPassword });
  const statuses = [
    ...Array(50).fill('OPEN'),
    ...Array(20).fill('ASSIGNED'),
    ...Array(10).fill('DELIVERED'),
    ...Array(4).fill('DISPUTED'),
    ...Array(30).fill('COMPLETED'),
    ...Array(6).fill('CANCELLED'),
  ];
  for (let i = 0; i < 120; i++) {
    const jobber = accounts[15 + Math.floor(i / 12)],
      worker = accounts[i % 15],
      status = statuses[i],
      amount = [10, 15, 35, 49.99, 50, 75, 99.99, 100, 150, 250, 400, 800][i % 12];
    const title = `${specialties[i % 15]} for ${['a bakery', 'an online store', 'a local studio', 'a consulting business', 'a community group'][Math.floor(i / 15) % 5]} · project ${i + 1}`;
    const task = (
      await post(jobber.token, 'tasks', {
        title,
        description: `We need ${specialties[i % 15].toLowerCase()} for a focused business project. Please confirm your approach, provide a reviewable result and include handover notes. We will share requirements in the task conversation.`,
        budget: amount,
        categoryId: category.id,
        isRemote: true,
      })
    ).task;
    await post(jobber.token, `payments/tasks/${task.id}/fund`, { confirmPreview: true });
    if (!['OPEN', 'CANCELLED'].includes(status)) {
      const offer = (
        await post(worker.token, `offers/task/${task.id}`, {
          amount,
          message: `I can handle the ${specialties[i % 15].toLowerCase()} work, share progress and provide clear handover notes.`,
        })
      ).offer;
      await post(jobber.token, `offers/${offer.id}/accept`, { confirmPreview: true });
      await post(worker.token, `messages/task/${task.id}`, {
        content:
          'Thanks for choosing me. I have reviewed the brief and will document the result for approval.',
      });
      if (['DELIVERED', 'DISPUTED', 'COMPLETED'].includes(status))
        await post(worker.token, `payments/tasks/${task.id}/deliver`, {
          notes:
            'The agreed work is ready for review. Handover notes explain the changes and how to check the result.',
        });
      if (status === 'DISPUTED') {
        await post(jobber.token, `payments/tasks/${task.id}/dispute`, {
          reason: 'The delivered work needs review against our agreed acceptance criteria.',
        });
        await post(worker.token, `payments/tasks/${task.id}/evidence`, {
          content:
            'The delivery notes describe how the result meets the agreed brief. Please review the documented changes.',
        });
      }
      if (status === 'COMPLETED') {
        if (i === 84) {
          await post(jobber.token, `payments/tasks/${task.id}/dispute`, {
            reason: 'We would like an independent review before approving this delivery.',
          });
          await post(adminAuth.token, `payments/admin/tasks/${task.id}/resolve`, {
            outcome: 'RELEASE',
            decision: 'The agreed deliverables were reviewed and the full task amount is awarded.',
          });
        } else await post(jobber.token, `payments/tasks/${task.id}/release`);
        if (i < 112)
          await post(jobber.token, `reviews/task/${task.id}`, {
            rating: [5, 5, 4, 5, 3][i % 5],
            comment: [
              'Clear communication and useful handover notes.',
              'The agreed work was delivered and easy to review.',
              'Good result; we clarified a few details during delivery.',
              'A practical solution for our business project.',
              'The work was completed after some revisions.',
            ][i % 5],
          });
      }
    }
    if (status === 'CANCELLED') await post(jobber.token, `payments/tasks/${task.id}/cancel`);
  }
  for (const a of accounts) {
    a.profile = 'http://127.0.0.1:5173/users/' + a.id;
    a.posted = await prisma.task.count({ where: { posterId: a.id } });
    a.completed = await prisma.task.count({
      where: { status: 'COMPLETED', offers: { some: { taskerId: a.id, status: 'ACCEPTED' } } },
    });
    a.reviews = await prisma.review.count({ where: { revieweeId: a.id } });
    delete a.token;
  }
  const distribution = await prisma.task.groupBy({ by: ['status'], _count: true });
  if ((await prisma.task.count()) !== 120 || (await prisma.review.count()) !== 28)
    throw new Error('Dataset counts did not match');
  const json = { accounts, admin: { email: admin.email, password: adminPassword }, distribution };
  fs.writeFileSync(rosterPath, JSON.stringify(json, null, 2));
  fs.writeFileSync(
    path.join(root, 'accounts.md'),
    '# Private marketplace accounts\n\nThese generated accounts are isolated from production.\n\n| Name | Login email | Password | Role | Specialty | Profile | Posted | Completed | Reviews |\n|---|---|---|---|---|---|---:|---:|---:|\n' +
      accounts
        .map(
          (a) =>
            `| ${a.name} | ${a.email} | ${a.password} | ${a.role} | ${a.specialty} | [Open profile](${a.profile}) | ${a.posted} | ${a.completed} | ${a.reviews} |`,
        )
        .join('\n') +
      `\n\nAdministrator: ${admin.email}\n\nPassword: ${adminPassword}\n`,
  );
  console.log(
    JSON.stringify({
      users: accounts.length,
      tasks: 120,
      reviews: 28,
      distribution,
      credentials: path.join(root, 'accounts.md'),
    }),
  );
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
