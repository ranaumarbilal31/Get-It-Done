# 🛠️ Get It Done — Your To-Do List. A Little Lighter.

<div align="center">

[![Checks](https://github.com/ranaumarbilal31/Get-It-Done/actions/workflows/ci.yml/badge.svg)](https://github.com/ranaumarbilal31/Get-It-Done/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18-090907?logo=react)](https://react.dev)
[![Rendering](https://img.shields.io/badge/Rendering-SSR%20%2B%20Prerender-6C5636)](#-rendering--seo)
[![License](https://img.shields.io/badge/License-MIT-B89973)](LICENSE)

**A local services marketplace for posting tasks, comparing offers, and collaborating through real-time chat.**

Charcoal. Earth brown. Amber. Cream. Self-hosted Fira Sans and a consistent, accessible marketplace experience.

[🌐 Website](https://get-it-done-steel.vercel.app) · [📡 API health](https://taskconnect-api.onrender.com/api/health) · [🔎 Audit](SEO_AUDIT.md) · [🛡️ Security](SECURITY_REPORT.md)

</div>

![Homepage — local verification data](docs/homepage-desktop.png)

## ✨ The Marketplace

| Jobbers                              | Taskers                                        | Administrators                                    |
| ------------------------------------ | ---------------------------------------------- | ------------------------------------------------- |
| Describe, price and fund a task      | Find local or remote work                      | Review held payments and transaction history      |
| Compare offers and choose a tasker   | Send a price and proposal                      | Review both parties’ dispute evidence             |
| Coordinate through private task chat | Deliver notes and HTTPS links                  | Release, refund or split with a written decision  |
| Approve delivery or raise a dispute  | Follow account credits and completed history   | Review identity submissions and support inquiries |
| Review completed work                | Build a profile from recorded work and reviews | Manage account permissions                        |

The homepage includes **“Get it done today”**, **“Turn your skills into cash”** and **“Post your first task in seconds.”** Categories and recent tasks come from the database. No invented testimonials or activity statistics are published. Public pages have a full footer; repository links and development banners are absent from the application.

## 💳 Funding, Delivery & Settlement

```text
DRAFT → funding → OPEN → jobber chooses offer → ASSIGNED
  → tasker delivery → DELIVERED → jobber approval → COMPLETED
                         │
                   dispute → DISPUTED → admin release / refund / split
```

All amounts are integer USD cents. Minimum task and offer price: **$2**. Maximum: **$50,000**. The jobber pays the agreed price plus $1. The tasker pays $1, then a percentage on the remaining amount. The original agreed task price determines the percentage, and each agreement stores its fee version and breakdown.

| Task price | Rate | Jobber total | Tasker net | Platform total |
| ---------- | ---- | ------------ | ---------- | -------------- |
| $10        | 2%   | $11          | $8.82      | $2.18          |
| $15        | 2%   | $16          | $13.72     | $2.28          |
| $50        | 4%   | $51          | $47.04     | $3.96          |
| $100       | 5%   | $101         | $94.05     | $6.95          |

Below $50: 2%; $50–$99.99: 4%; from $100: 5%. Percentage deductions round to the nearest cent. Offer-price differences are settled before hiring, without charging the connection fee twice.

Disputes freeze held payments. Only an administrator can decide release, refund or partial settlement, with a recorded reason. Full refunds return all held charges and waive fees. Partial settlements return the unused task price and cap the tasker connection fee to prevent a negative payout. Before hiring, the jobber can cancel for a full refund; after hiring, use platform review.

**Implementation boundary:** the current payment provider is a simulation behind an adapter. The transaction dialog explicitly says no actual charge occurs. No real card credentials are collected, no bank custody or withdrawals are implemented, and account credits do not transfer money. Connect and verify a real payment provider before handling actual customer funds. Financial mutations use database transactions, status/revision checks and unique operation ledger keys to prevent repeated settlement. Legacy payment snapshots and wallet amounts are reconciled without re-crediting past payouts.

## 🏗️ Architecture

```text
Vercel: React + Vite + Tailwind
  ├── Prerendered informational pages
  ├── Node functions: public SSR and sitemap
  └── Signed account-email relay → Gmail SMTP
               │ REST proxy / authenticated Socket.IO
Render: Express + Prisma + Socket.IO
               │
Persistent PostgreSQL in deployment / SQLite for isolated local work
```

- Public HTML contains headings, categories, task links and descriptions before JavaScript runs.
- Maps and administrative modules load separately; private account state stays client-side.
- Public profiles use a narrow field selection and remain `noindex`.
- Socket identities come from JWTs, with participant checks for joins, reads and sends. Session revocation also disconnects sockets.
- New task/avatar images are bounded WebP; identity submissions are private. Configure persistent public image storage for deployment.
- Account activation uses hashed, single-use 24-hour tokens; password reset uses 30-minute tokens. Reset/change revokes existing sessions.
- Marketplace notifications stay inside the application. Contact forms persist inquiries for administrators.

## 🚀 Local Setup

Use **Node.js 22.19+** and npm. From the repository root:

```bash
npm ci --prefix server
npm ci --prefix client
```

Copy `server/.env.example` to `server/.env`. Set a local SQLite `DATABASE_URL` and a strong development `JWT_SECRET`. Initialize an empty local database and start each service in its own terminal:

```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:push
npm --prefix server run dev
# Second terminal
npm --prefix client run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The API uses port 5000. `npm start` in `server` selects the schema by database URL, applies compatible additions without accepting destructive changes, reconciles legacy money fields, then starts Express. Back up production data before deployment. The old seed command is destructive and now requires an explicit disposable-data guard; it is unnecessary for normal startup.

```bash
npm run build
npm --prefix client run preview
```

`API_ORIGIN` controls server-side API reads; `VITE_API_URL` controls browser API configuration. Do not point private staging at production.

## 👥 Private Marketplace Verification

```bash
npm run staging:populate
npm run staging:serve
# Separate terminal, after building
npm --prefix client run preview
```

The population command uses a fixed local `.private-staging/marketplace.db`, refuses production targets, exercises application APIs and reuses an existing completed dataset without duplication.

| Accounts / activity              | Count                  |
| -------------------------------- | ---------------------- |
| Tech taskers                     | 15                     |
| Jobbers                          | 10, with 12 tasks each |
| Tasks                            | 120                    |
| Open / assigned / delivered      | 50 / 20 / 10           |
| Disputed / completed / cancelled | 4 / 30 / 6             |
| Reviews on completed tasks       | 28                     |

A separate administrator supports local review. Balances, completed history and reviews come from funding, hiring, delivery and settlement operations. **These are generated private fixtures, not genuine customer experiences.** They are never uploaded to production. Names, emails, passwords, roles, specialties, profile links and activity counts are in `.private-staging/accounts.md`; it and the database are Git-ignored. Keep that credential table private.

## ✉️ Activation & Password Recovery

Sender and live verification inbox: **phalanx.getitdone@gmail.com**.

| Host   | Server-side variables                                                                |
| ------ | ------------------------------------------------------------------------------------ |
| Vercel | `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_RELAY_SECRET`, optional `PUBLIC_SITE_URL` |
| Render | `EMAIL_RELAY_URL`, the same `EMAIL_RELAY_SECRET`, `PUBLIC_SITE_URL`                  |

Set `EMAIL_RELAY_URL` to `https://get-it-done-steel.vercel.app/api/account-email`. Never use `VITE_` prefixes for secrets. Enable Gmail 2-Step Verification and create an app password yourself, then save it only in Vercel’s secret settings. [Google’s app-password instructions](https://support.google.com/accounts/answer/185833).

The API signs timestamped requests with HMAC-SHA256. The relay validates the signature, timestamp, recipient, allowed template and link origin before awaiting Gmail SMTP on port 465. Replay suppression is per warm function instance; timestamp validation is enforced across instances. [Vercel SMTP guidance](https://vercel.com/kb/guide/serverless-functions-and-smtp).

**Live delivery requires the owner’s secrets and has not yet been verified.** Registration reports a delivery failure truthfully; recovery responses avoid disclosing whether an account exists. Local tests capture messages without sending external emails. Once configured and redeployed, register the owner inbox, follow the activation link, request a reset, verify its link and confirm old sessions are rejected. An owned domain and a transactional email provider such as Resend can replace this adapter later.

## 🔎 Rendering & SEO

Canonical origin: `https://get-it-done-steel.vercel.app`.

```html
<title>Browse tasks | Get It Done</title>
<meta
  name="description"
  content="Find local and remote tasks, compare clear budgets and send your offer. Browse opportunities by category and choose work that fits your skills."
/>
<link rel="canonical" href="https://get-it-done-steel.vercel.app/tasks" />
```

Visible breadcrumbs have matching structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://get-it-done-steel.vercel.app/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Browse tasks",
      "item": "https://get-it-done-steel.vercel.app/tasks"
    }
  ]
}
```

```text
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /template.html
Sitemap: https://get-it-done-steel.vercel.app/sitemap.xml
```

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://get-it-done-steel.vercel.app/</loc></url>
  <url><loc>https://get-it-done-steel.vercel.app/tasks</loc></url>
</urlset>
```

The live sitemap also lists canonical informational pages and existing open task details, splitting at protocol limits. It excludes drafts, utility/account routes, public profiles and search variants. Search variants canonicalize to the clean listing and use `noindex,follow`. Missing resources return 404; upstream failures return 503. Robots rules do not replace authentication. Metadata descriptions support click-through; no ranking claims or fabricated authors/ratings are made.

## 🧪 Verified Checks

```bash
npm --prefix server test
npm --prefix client test
npm --prefix client run build
# PowerShell production browser mode:
$env:E2E_PRODUCTION='1'; npm --prefix client run test:e2e
npm --prefix client run lighthouse
# From client/, after deployment:
node scripts/smoke.js
```

| Check                        | Recorded result                                                       |
| ---------------------------- | --------------------------------------------------------------------- |
| Backend integration/security | **106 passed**, disposable SQLite, external effects disabled          |
| Metadata/sitemap             | **5 passed**                                                          |
| Production Chromium flows    | **17 passed**                                                         |
| Public/account/admin layouts | **375px, 768px, 1440px**, no detected overflow                        |
| Automated accessibility      | Representative public routes passed axe checks                        |
| Lighthouse mobile lab        | **93 performance / 100 accessibility / 100 best practices / 100 SEO** |
| Lab LCP / CLS / TBT          | **2.22s / 0 / 238ms**                                                 |

[Measured Lighthouse summary](docs/lighthouse-summary.json). These local lab results do not establish field INP or a real-user Core Web Vitals pass. Production cold starts, device/network variation and real traffic require separate measurement. See the [prioritized audit](SEO_AUDIT.md) and [security boundaries](SECURITY_REPORT.md). CI installs isolated dependencies, runs these checks, builds SSR and retains browser diagnostics.

## ✅ Owner Next Steps

- Configure the Gmail app password and shared relay secret; verify live activation and reset links.
- Review payment/dispute terms and public copy with a human editor before commercial use.
- Integrate and verify a real provider before collecting actual funds; confirm database backup/retention and persistent image storage.
- Verify Search Console ownership, submit `/sitemap.xml`, inspect representative URLs and validate schema in Google’s Rich Results Test.
- Review field LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile when data is available.

#react #vite #tailwindcss #express #prisma #socketio #marketplace #local-services #technical-seo
