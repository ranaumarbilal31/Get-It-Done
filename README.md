# TaskConnect — Community Task Marketplace

[![CI Pipeline](https://github.com/placeholder/taskconnect/actions/workflows/ci.yml/badge.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security Tested](https://img.shields.io/badge/Security-OWASP%20Tested%20(27%2F27)-brightgreen)](SECURITY_REPORT.md)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Postgres%20%7C%20Socket.IO-blue)](DECISIONS.md)
[![Budget](https://img.shields.io/badge/Budget-%240%20Free%20Tier-teal)](#free-tier-deployment-guide)

**TaskConnect** is a production-grade, two-sided task marketplace modeled after **Airtasker** and **TaskRabbit**. Built for a student budget of **$0**, it demonstrates that real-world, high-performance web applications featuring real-time WebSockets, geolocation maps, escrow payment simulations, and administrative identity verification can be engineered entirely using free, open-source software and developer-tier cloud services.

---

## 1. Core Feature Highlights

- **Task Publishing & Geolocation Discovery:** Posters define tasks with budgets, due dates, and photo attachments. In-person tasks include an interactive **Leaflet / OpenStreetMap** coordinate picker; remote tasks are highlighted with online badges.
- **Interactive Multi-Marker Price Map:** Browse tasks on an interactive OpenStreetMap canvas with custom price tag markers (`$180`, `$220`).
- **Competitive Bidding System:** Taskers submit custom quotes and proposals. Posters compare ratings, trust badges, and prior client feedback.
- **Simulated Escrow Payment System:** When an offer is accepted, funds are pre-authorized and held in platform escrow (Stripe Test Mode simulation with card `4242 •••• •••• 4242`). Payment is only released to the tasker's wallet once the poster approves completion.
- **Real-Time WebSockets Chat:** Bi-directional chat rooms per task (`task_{taskId}`) powered by **Socket.IO** with instant messaging, live typing indicators, and unread alerts.
- **Mutual 5-Star Reviews & Ratings:** Post-completion rating selector (1–5 stars) with automatic recalculation of average ratings and public review histories.
- **Mock Identity KYC Verification:** Users upload government ID photos to earn the green **Verified Tasker** badge. Admins inspect submissions in the moderation queue and approve or reject applications.
- **Administrative Control Center:** Oversee platform KPIs (Total Users, Active Tasks, Escrow Volume, Completed Jobs), manage user roles, and moderate content.

---

## 2. Architecture & Free-Tier Stack

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   React 18 (Vite) + Tailwind CSS + Lucide Icons + React-Leaflet (OpenStreetMap) |
+---------------------------------------+-----------------------------------------+
                                        |
                 REST JSON API (JWT)    |    WebSockets (Socket.IO)
                                        v
+---------------------------------------------------------------------------------+
|                                 SERVER LAYER                                    |
|     Node.js + Express REST API Server + Socket.IO Bi-directional Engine         |
+---------------------+-------------------+-------------------+-------------------+
                      |                   |                   |
                      v                   v                   v
              +---------------+   +---------------+   +---------------+
              |   DATABASE    |   |    ESCROW     |   |    STORAGE    |
              |  Prisma ORM   |   | Stripe Test   |   |  Multi-Tier   |
              | Neon / SQLite |   | Simulated     |   | Cloudinary/URI|
              +---------------+   +---------------+   +---------------+
```

| Layer | Primary Free Platform | Verified Quota | Plan B Alternative | Plan B Quota |
|---|---|---|---|---|
| **Frontend SPA** | **Vercel** | 100 GB bandwidth / mo | **Netlify** / **Cloudflare Pages** | 100 GB bandwidth, 300 build mins |
| **Backend API** | **Render** | 750 free hours / mo | **Fly.io** / **Railway** | Fly free allowance / Railway trial |
| **Database** | **Neon.tech** | 0.5 GB permanent storage | **Supabase** | 500 MB DB (needs 7-day heartbeat) |
| **File Storage** | **Cloudinary** | 25 credits / mo (~25 GB) | **Supabase Storage** / Base64 DB | 1 GB storage free |
| **Maps** | **Leaflet + OSM** | Unlimited raster tiles ($0) | **MapLibre GL + MapTiler** | 100k requests/mo free |
| **Email** | **Brevo SMTP** | 300 emails / day ($0) | **Gmail SMTP** / Console Log | Free personal SMTP |

---

## 3. Quick Start Guide (Local Development)

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Launch

1. **Install Server Dependencies & Initialize Database:**
   ```bash
   cd server
   npm install
   npx prisma db push
   node prisma/seed.js
   ```

2. **Start Backend Server:**
   ```bash
   npm start
   # API running at: http://localhost:5000
   # WebSocket running on: ws://localhost:5000
   # Health check at: http://localhost:5000/api/health
   ```

3. **Install Client Dependencies & Launch Frontend:**
   ```bash
   cd ../client
   npm install
   npm run dev
   # Web application opens at: http://localhost:5173
   ```

---

## 4. Pre-Configured Demo Accounts (1-Click Fill)

The login screen (`/login`) includes **1-Click Demo Login** buttons:

| Role | Email | Password | Description |
|---|---|---|---|
| **Administrator** | `admin@taskconnect.com` | `Password123!` | Accesses `/admin` to approve ID verifications and inspect escrow KPIs. |
| **Poster** | `sarah@example.com` | `Password123!` | Publishes tasks, reviews incoming quotes, and approves job completion. |
| **Verified Tasker** | `alex@example.com` | `Password123!` | 5-star flatpack specialist with Verified Badge and earned wallet balance. |
| **Verified Tasker** | `elena@example.com` | `Password123!` | 5-star cleaning expert with 20+ completed job reviews. |
| **Pending KYC** | `jessica@example.com` | `Password123!` | Submitted driver license awaiting admin approval in the KYC queue. |

---

## 5. Security & Automated Test Results

TaskConnect is built with defense-in-depth security:
- **HTTP Security Headers:** Configured via **Helmet** with custom Content Security Policy (CSP).
- **Brute-Force Defense:** Rate limiting via **express-rate-limit** (15 auth attempts/15 min; 120 API req/min).
- **Strict Input Validation:** **Zod** schema validation middleware on all incoming requests.
- **IDOR Protection:** Server-side ownership verification on all task, offer, and payment mutations.

### Automated Test Battery (27 Tests Passing)
```bash
$ npm test

 ✓ test/redteam.test.js (12 tests) 321ms
 ✓ test/api.test.js (15 tests) 527ms

 Test Files  2 passed (2)
      Tests  27 passed (27)
   Duration  1.41s
```
*See [`SECURITY_REPORT.md`](SECURITY_REPORT.md) for the complete penetration testing attack-and-defense audit.*

---

## 6. Free-Tier Cloud Deployment Guide

### Step 1: Deploy PostgreSQL on Neon.tech (Permanent Free Tier)
1. Go to [Neon.tech](https://neon.tech) and create a free account (no credit card required).
2. Create a new project named `taskconnect-db`.
3. Copy the pooled PostgreSQL connection string:
   ```
   postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Deploy Backend Web Service on Render.com
1. Go to [Render.com](https://render.com) and create a free account.
2. Click **New +** -> **Web Service**, and link your GitHub repository.
3. Configure the service:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma db push && node prisma/seed.js`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (750 hours/month)
4. Add Environment Variables:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   - `JWT_SECRET`: *(A random 32-character secret string)*
   - `CLIENT_URL`: `https://your-taskconnect-app.vercel.app`
   - `NODE_ENV`: `production`

### Step 3: Deploy Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Configure settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://your-taskconnect-backend.onrender.com`

---

## 7. Project Documentation Index

- [`PROJECT_STATE.md`](PROJECT_STATE.md): Current audit state, runtime checks, and dependency status.
- [`PLAN.md`](PLAN.md): End-to-end production engineering roadmap.
- [`SECURITY.md`](SECURITY.md): STRIDE threat model, trust boundaries, and OWASP Top 10 countermeasures.
- [`SECURITY_REPORT.md`](SECURITY_REPORT.md): Red-team penetration testing record.
- [`DECISIONS.md`](DECISIONS.md): Architectural decision records (ADRs) and trade-off analysis.
- [`PROJECT_REPORT.md`](PROJECT_REPORT.md): In-depth academic report on free-tier marketplace substitution.
- [`LICENSE`](LICENSE): Official MIT License.
- [`TERMS.md`](TERMS.md): Terms of Service.
- [`PRIVACY.md`](PRIVACY.md): Privacy Policy.
