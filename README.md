# 🛠️ Get It Done — A Little Help. A Lot More Done.

<div align="center">

[![Checks](https://github.com/ranaumarbilal31/Get-It-Done/actions/workflows/ci.yml/badge.svg)](https://github.com/ranaumarbilal31/Get-It-Done/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18-24221e?logo=react)](https://react.dev)
[![Rendering](https://img.shields.io/badge/Rendering-SSR%20%2B%20Prerender-ba4214)](#-rendering--seo)
[![License](https://img.shields.io/badge/License-MIT-819d79)](LICENSE)

**A local services marketplace for posting tasks, comparing offers, and collaborating through real-time chat.**

Warm cream. Charcoal type. Orange accents. Practical tools for everyday jobs and remote projects.

[🌐 Website](https://get-it-done-steel.vercel.app) · [📡 API health](https://taskconnect-api.onrender.com/api/health) · [🧪 Verification](SEO_AUDIT.md) · [🛡️ Security](SECURITY_REPORT.md)

**Demonstration marketplace:** payment holds, commissions, payouts, and wallets are simulated. No real money is charged or transferred. Identity badges reflect admin-reviewed submissions, not background checks or trade credentials.

</div>

![Desktop homepage preview using local demonstration data](docs/homepage-desktop.png)

---

## ✨ What You Can Do

| For posters                               | For taskers                                  | For administrators                             |
| ----------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| Describe a task and set a USD budget      | Search local or remote work                  | Review identity sample submissions             |
| Choose a category, location, and due date | Filter tasks by category, budget, and status | Inspect documents through authorized endpoints |
| Compare proposals and hire a tasker       | Send a price and proposal                    | Approve/reject submissions and manage roles    |
| Chat privately after hiring               | Coordinate with the poster in real time      | View marketplace activity and demo balances    |
| Confirm completion and leave feedback     | Receive a simulated wallet credit            | Monitor the demonstration workflow             |

The complete interface shares a responsive visual system: accessible fields, keyboard focus, dialogs, clear errors, retries, and honest demo labels. Informational pages explain the product without invented testimonials, rankings, or safety guarantees.

## 🏗️ Architecture

```text
Vercel: React + Vite
  ├── Prerendered informational pages
  ├── Node functions: public page SSR + sitemap
  └── Hydrated interactions + lazy Leaflet maps
            │ REST proxy / authenticated Socket.IO
Render: Express + Prisma + Socket.IO
            │
SQLite for isolated local evaluation / PostgreSQL deployment schema
```

- **UI:** React 18, React Router 7, Tailwind 3, Lucide, Leaflet/OpenStreetMap.
- **API:** Express, Prisma, Zod, JWT authentication, Socket.IO.
- **Uploads:** Multer 2; Sharp converts new task/avatar raster uploads to bounded WebP. Identity submissions remain private data in the database.
- **Email:** Nodemailer; SMTP is optional. Unconfigured delivery is explicitly reported as demo mode.
- **Payments:** simulated records only. The presence of a Stripe dependency does not establish a live integration.

## 🚀 Local Setup

Use **Node.js 22.19+** and npm. Commands below are run from the repository root.

```bash
npm ci --prefix server
npm ci --prefix client
```

Create `server/.env` from `server/.env.example` and set a local SQLite URL and development JWT secret. Then initialize a **new local evaluation database**:

```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:push
npm --prefix server run seed
```

**The seed script resets its configured database. Use it only with your disposable local database.** Automated tests create their own isolated databases; they do not use your application database.

Start the API and frontend in separate terminals:

```bash
npm --prefix server run dev
npm --prefix client run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The frontend defaults to the local API at port 5000. Do not copy a production `VITE_API_URL` into your local environment unless you intend to use that API.

```bash
npm run build
npm --prefix client run preview
```

The preview serves the production SSR build. Set `API_ORIGIN` to change its server-side API origin.

## 👥 Sample Accounts

The login screen fills these credentials for evaluation; you still click **Log in** to submit them. Accounts exist only after seeding or when the deployment operator provisions them.

| Role   | Email                 | Password       |
| ------ | --------------------- | -------------- |
| Admin  | `admin@getitdone.com` | `Password123!` |
| Poster | `sarah@example.com`   | `Password123!` |
| Tasker | `alex@example.com`    | `Password123!` |

Public demo passwords are unsuitable for commercial deployment. Use clearly labelled sample documents to evaluate verification; do not upload sensitive real identity records.

## 🧪 Verified Results

October 7, 2026: **75 backend tests, 5 SEO tests and 14 production browser tests passed**. Responsive routes were checked at 375, 768 and 1440 pixels, including task details, public profiles, account and admin screens.

Local Lighthouse mobile simulation: **99 performance / 100 accessibility / 100 best practices / 100 SEO**; LCP **1.6s**, CLS **0**, TBT **32ms**. These are lab observations, not field Core Web Vitals or ranking claims. See [full audit](SEO_AUDIT.md) and [measurement summary](docs/lighthouse-summary.json).

Both production dependency audits reported zero vulnerabilities. Five high findings remain in the frontend Tailwind 3 build-only dependency chain; details and limits are recorded in [security verification](SECURITY_REPORT.md).

## 🔎 Rendering & SEO

Public informational pages are prerendered. The homepage, listings, and task details receive public content and links in their initial HTML, then hydrate. Maps and account interactions remain client-side.

- Absolute, route-specific canonicals and unique titles/descriptions.
- One H1 with descriptive content and a logical heading hierarchy.
- Visible breadcrumbs with matching `BreadcrumbList` JSON-LD; factual `WebSite` markup.
- Search/filter variants, private accounts, public profiles, and utility screens deliberately use `noindex`.
- Open tasks and public informational routes populate a generated sitemap. Closed tasks and utility routes are excluded. The generator splits at 50,000 entries or before 50 MB.
- Missing routes/tasks return 404; catalog outages return 503. Errors do not masquerade as empty results.
- Prerendered preview deployments use `noindex`; SSR previews also send an `X-Robots-Tag` header.

Example generated metadata:

```html
<title>Browse tasks | Get It Done</title>
<meta name="robots" content="index,follow" />
<link rel="canonical" href="https://get-it-done-steel.vercel.app/tasks" />
```

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
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://get-it-done-steel.vercel.app/</loc></url>
  <url><loc>https://get-it-done-steel.vercel.app/tasks</loc></url>
</urlset>
```

The examples illustrate the generated output; the live sitemap also includes eligible informational pages and existing open task URLs. Meta descriptions help communicate relevance and can influence click-through; they are not a direct ranking factor. No FAQ rich-result eligibility is claimed; FAQ markup is intentionally omitted.

## 🧪 Verification

```bash
npm test                         # frontend SEO + isolated backend suites
npm --prefix client exec playwright install chromium
npm run test:e2e                  # isolated browser and accessibility tests
npm --prefix client run lighthouse # production-build mobile lab measurement
```

The browser suite covers 375px, 768px, and 1440px layouts, raw HTML without JavaScript, profile identity, filter/history synchronization, retries, duplicate submissions, the task lifecycle, and verification/admin inspection. CI installs dependencies from explicit lockfiles and retains browser diagnostics.

See [SEO_AUDIT.md](SEO_AUDIT.md) for measured results and [SECURITY_REPORT.md](SECURITY_REPORT.md) for limitations. Test coverage is evidence for the tested scenarios, not certification or proof of immunity.

## 📡 Selected API Interfaces

| Method     | Route                                       | Purpose                                           |
| ---------- | ------------------------------------------- | ------------------------------------------------- |
| GET        | `/api/health`                               | Minimal availability check                        |
| POST       | `/api/auth/register`, `/api/auth/login`     | Account access                                    |
| GET        | `/api/users/:id`                            | Requested public profile; excludes private fields |
| GET / POST | `/api/tasks`                                | Discovery and task creation                       |
| GET        | `/api/tasks/:id`                            | Task details with viewer-appropriate privacy      |
| POST       | `/api/offers/task/:id`                      | Submit/update a proposal                          |
| POST       | `/api/offers/:id/accept`                    | Hire and record a simulated payment hold          |
| PATCH      | `/api/tasks/:id/complete`                   | Complete and record simulated payout              |
| GET / POST | `/api/messages/task/:id`                    | Authorized participant conversations              |
| POST       | `/api/reviews/task/:id`                     | Post-completion feedback                          |
| POST       | `/api/auth/verify-id`                       | Submit an identity sample                         |
| GET        | `/api/admin/verifications/:userId/document` | Admin-only document inspection                    |
| POST       | `/api/contact`                              | Send an inquiry or report demo delivery           |

Sockets authenticate with `auth.token`. The server derives message identity and authorizes task rooms; client-supplied sender IDs do not grant access.

## ☁️ Deployment

Vercel project root: **`client`**. Build: `npm run build`. Output: `dist/client`. Keep Node functions enabled; this is not a static SPA deployment.

- `API_ORIGIN`: server-only backend origin, normally `https://taskconnect-api.onrender.com`.
- `VITE_API_URL`: optional direct browser API/socket origin; leaving it empty uses the REST proxy and the production socket default.
- `CLIENT_URL`: backend CORS origin; configure the production URL explicitly.
- Deploy the backend using its **PostgreSQL schema** and the operator's established deployment process. Do not run the local SQLite seed on production data.
- Set a unique production JWT secret, SMTP if needed, and appropriate storage configuration.

Cloudinary/Unsplash assets receive responsive WebP source sets where supported. Local uploads are WebP; the database data-URI fallback has no responsive CDN delivery and needs replacement with an appropriate storage configuration before larger deployments.

## 📬 Contact & Documentation

[ranaumarbilal31@gmail.com](mailto:ranaumarbilal31@gmail.com) · [About](https://get-it-done-steel.vercel.app/about) · [Questions](https://get-it-done-steel.vercel.app/faq)

[Security model](SECURITY.md) · [Security report](SECURITY_REPORT.md) · [SEO audit](SEO_AUDIT.md) · [Architecture decisions](DECISIONS.md) · [Project state](PROJECT_STATE.md) · [Terms](TERMS.md) · [Privacy](PRIVACY.md)

No response-time SLA, legal compliance certification, ranking, or field Core Web Vitals result is claimed.

## ✅ Next Steps — Operator Checklist

- [ ] Complete a human factual/editorial review of public copy, identity wording, and legal pages before commercial launch.
- [ ] Verify ownership of the production URL in Google Search Console, open **Sitemaps**, and submit `sitemap.xml`.
- [ ] Use **URL Inspection → Test live URL** for the homepage, `/tasks`, and an open task.
- [ ] Validate representative breadcrumb markup with [Google's Rich Results Test](https://search.google.com/test/rich-results).
- [ ] Review CrUX/Search Console field data against LCP ≤ 2.5s, INP ≤ 200ms, and CLS ≤ 0.1 at the 75th percentile. Local lab results do not establish these outcomes.
- [ ] Replace demo credentials/payment behavior and review legacy identity-document storage before handling real users or money.

---

**#GetItDone #LocalServices #Marketplace #React #Vite #TailwindCSS #Express #Prisma #SocketIO #TechnicalSEO**

<div align="center">Good skills. Everyday possibilities.</div>
