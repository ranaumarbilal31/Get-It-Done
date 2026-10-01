# 🛠️ TaskConnect — Community Task Marketplace

<div align="center">

[![CI Pipeline](https://github.com/ranaumarbilal31/Get-It-Done/actions/workflows/ci.yml/badge.svg)](https://github.com/ranaumarbilal31/Get-It-Done/actions)
[![API Status](https://img.shields.io/badge/API-Live%20on%20Render-brightgreen?logo=render)](https://taskconnect-api.onrender.com/api/health)
[![Database](https://img.shields.io/badge/Database-Neon%20Postgres%2018-00E599?logo=postgresql)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security Tested](https://img.shields.io/badge/Security-OWASP%20Tested%20(27%2F27)-brightgreen?logo=shield)](SECURITY_REPORT.md)
[![Budget](https://img.shields.io/badge/Budget-%240%20Student%20Tier-teal?logo=googlecloud)](#-zero-dollar-cloud-architecture)

**A production-grade, two-sided task marketplace modeled after Airtasker and TaskRabbit.**  
Engineered with real-time WebSockets, OpenStreetMap geolocation, simulated Stripe escrow payments, and administrative KYC identity verification — built entirely for a **$0 budget** using open-source tools and permanent cloud free tiers.

[🌐 Live API](https://taskconnect-api.onrender.com) • [🏥 System Health](https://taskconnect-api.onrender.com/api/health) • [📖 API Reference](#-api-endpoints-reference) • [🛡️ Security Report](SECURITY_REPORT.md) • [👥 Demo Accounts](#-pre-configured-demo-accounts)

</div>

---

## 📌 Executive Summary

TaskConnect demonstrates that enterprise-caliber marketplace functionality does not require expensive proprietary cloud services. Through defensive systems engineering and smart architectural adapters, the platform provides seamless peer-to-peer contracting, live chat, multi-marker geolocation, and financial escrow handling with **zero recurring infrastructure costs**.

---

## ✨ Core Feature Highlights

### 1. 📍 Task Publishing & Geolocation Discovery
* **Interactive Map Picker:** Posters select coordinates directly on an interactive **Leaflet / OpenStreetMap** canvas with automated reverse geocoding.
* **Remote vs. In-Person Filter:** Filter tasks based on physical proximity or search remote-only digital gigs.
* **Multi-Marker Price Canvas:** Browse available gigs on an interactive map rendered with custom dollar-value price badge markers (`$180`, `$220`).

### 2. 💼 Competitive Bidding & Offer Management
* **Custom Proposals:** Taskers submit competitive quotes with tailored cover notes.
* **Reputation Comparison:** Posters inspect bidder profiles, average star ratings, customer review counts, and verified ID trust badges.

### 3. 💳 Simulated Escrow Payment Engine
* **Pre-Authorized Escrow:** When an offer is accepted, funds are simulated through a Stripe test card flow (`4242 •••• •••• 4242`) and held safely in platform escrow (`HELD_IN_ESCROW`).
* **Platform Fee Split:** Automatically deducts a 10% marketplace commission upon release.
* **Milestone Payout:** Funds are transferred to the Tasker’s digital wallet only after the Poster inspects and confirms job completion.

### 4. 💬 Real-Time WebSockets In-App Chat
* **Bi-directional Socket.IO Channels:** Instant room-based messaging (`task_{taskId}`) between poster and hired tasker.
* **Live Presence:** Real-time online indicators, live typing indicators, and unread notification alerts.

### 5. ⭐ Mutual 5-Star Reputation System
* **Two-Sided Reviews:** Post-job ratings (1–5 stars) and feedback comments.
* **Dynamic Recalculation:** Atomic database recalculation of average ratings and total job counts.

### 6. 🛡️ Administrative Control & KYC Identity Moderation
* **Mock Identity KYC Verification:** Taskers upload photo ID documents to request the green **Verified Tasker** badge.
* **Admin Moderation Queue:** Dedicated `/admin` dashboard for administrators to inspect KYC documents, approve/reject verifications, and audit platform KPIs (Users, Tasks, Escrow Volume, Completed Jobs).

---

## 🏗️ Architecture & Cloud Infrastructure

```
                                  +-----------------------+
                                  |      Vercel CDN       |
                                  |  React 18 + Vite SPA  |
                                  | Tailwind CSS + Lucide |
                                  +-----------+-----------+
                                              |
                          HTTPS / REST API    |   WSS / Socket.IO
                         (Bearer JWT Tokens)  |  (Bi-directional)
                                              v
                                  +-----------------------+
                                  |   Render Web Service  |
                                  |  Express.js API Node  |
                                  |  Helmet + RateLimit   |
                                  +-----+-----------+-----+
                                        |           |
               Prisma Connection Pooler |           | Multi-Tier Adapter
                                        v           v
                          +-------------------+   +--------------------+
                          |     Neon.tech     |   | Cloudinary / Base64|
                          |  PostgreSQL 18.6  |   | Persistent Storage |
                          |  Permanent Free   |   | Data URI Fallback  |
                          +-------------------+   +--------------------+
```

### 💰 Zero-Dollar Cloud Stack Quotas

| Layer | Cloud Provider | Free Tier Limit | Production Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | 100 GB Bandwidth / month | 🟢 Configured with SPA rewrite rules |
| **Backend API** | **Render** | 750 free instance hours / month | 🟢 Live at [taskconnect-api.onrender.com](https://taskconnect-api.onrender.com) |
| **Database** | **Neon.tech** | 0.5 GB permanent storage, Postgres 18 | 🟢 Live & Seeded (Ohio `us-east-2`) |
| **Asset Storage**| **Cloudinary / Base64**| 25 credits/month + Data URI fallback | 🟢 Multi-tier persistent adapter |
| **Maps & Geo** | **Leaflet + OpenStreetMap**| Unlimited free raster tiles | 🟢 Zero API keys required |
| **Escrow** | **Stripe Test Mode** | Unlimited sandbox transactions | 🟢 Full simulated lifecycle |

---

## 👥 Pre-Configured Demo Accounts

For instant testing, the login screen (`/login`) includes **1-Click Demo Login** shortcuts:

| Role | Demo Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- |
| 👑 **Administrator** | `admin@taskconnect.com` | `Password123!` | Moderates KYC IDs, oversees platform metrics at `/admin`. |
| 📝 **Poster** | `sarah@example.com` | `Password123!` | Posts tasks, accepts offers, locks escrow, approves completion. |
| 🔨 **Verified Tasker** | `alex@example.com` | `Password123!` | Flatpack & handyman specialist with Verified Badge and earned wallet funds. |
| 🧹 **Verified Tasker** | `elena@example.com` | `Password123!` | Cleaning professional with 5.0 star rating and 20+ completed jobs. |
| ⏳ **Pending KYC** | `jessica@example.com` | `Password123!` | Applicant with pending ID verification awaiting admin review. |

---

## 🔒 Security Posture & Defense-in-Depth

TaskConnect is engineered according to the **STRIDE threat model** and defends against the OWASP Top 10 vulnerabilities:

* **HTTP Security Headers:** Configured via **Helmet** with strict Content Security Policy (CSP) allowlisting OpenStreetMap tiles and avatar origins.
* **Brute-Force & DoS Defense:** Multi-tier rate limiting using **express-rate-limit** (15 auth attempts / 15 min; 120 API requests / min).
* **Schema Validation & Sanitization:** Strict request validation powered by **Zod** on all incoming payloads.
* **Access Control & IDOR Guard:** Explicit user ownership validation preventing unauthorized mutations to tasks, bids, and financial records.
* **Secure Token Handling:** Short-lived signed JWTs with `bcryptjs` password hashing (salt rounds: 10).

### 🧪 Automated Test Suite (27/27 Tests Passing)

```bash
$ npm test

 RUN  v3.2.7 server/

 ✓ test/redteam.test.js (12 tests) 321ms
   ✓ SQL Injection immunity on search & filter queries
   ✓ Cross-Site Scripting (XSS) payload sanitization
   ✓ IDOR prevention on task updates and bid cancellations
   ✓ Unauthorized escrow release prevention
   ✓ Role privilege escalation defense (admin guard)
   ✓ Brute-force rate limiting trip verification

 ✓ test/api.test.js (15 tests) 527ms
   ✓ User registration & JWT generation
   ✓ Credential validation & 401 on bad password
   ✓ Public task catalog browsing
   ✓ Bidding, acceptance, and escrow transition
   ✓ Job completion and wallet payout
   ✓ Mutual rating recalculation

 Test Files  2 passed (2)
      Tests  27 passed (27)
   Duration  1.40s
```

*See [`SECURITY_REPORT.md`](SECURITY_REPORT.md) for the full 12-vector offensive red-team penetration test report.*

---

## 📡 API Endpoints Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System uptime, version, and database connectivity. |
| `POST` | `/api/auth/register` | Public | Register new user account with Zod validation. |
| `POST` | `/api/auth/login` | Public | Authenticate user and return signed JWT. |
| `GET` | `/api/auth/me` | Authenticated | Fetch current profile, role, and wallet balance. |
| `GET` | `/api/categories` | Public | Retrieve marketplace categories with task counts. |
| `GET` | `/api/tasks` | Public | Browse, search, and filter task listings with geo-coordinates. |
| `POST` | `/api/tasks` | Authenticated | Post a new task with budget, deadline, and location. |
| `POST` | `/api/offers/task/:id` | Authenticated | Submit bid quote and proposal on an open task. |
| `POST` | `/api/offers/:id/accept`| Poster Only | Accept bid, transition task to `ASSIGNED`, lock escrow funds. |
| `PATCH`| `/api/tasks/:id/complete`| Poster Only| Release escrow funds ($90% to Tasker, 10% platform fee). |
| `POST` | `/api/reviews/task/:id`| Hired Parties | Submit mutual 5-star review and rating. |
| `GET` | `/api/admin/stats` | Admin Only | Inspect marketplace KPIs and escrow volume. |
| `POST` | `/api/admin/kyc/:id` | Admin Only | Approve or reject user identity verification submissions. |

---

## 🚀 Local Development Setup

### Prerequisites
* Node.js (v18+)
* npm (v9+)

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/ranaumarbilal31/Get-It-Done.git
   cd Get-It-Done
   ```

2. **Setup Server & Database:**
   ```bash
   cd server
   npm install
   npx prisma db push
   node prisma/seed.js
   npm start
   # Server running at: http://localhost:5000
   ```

3. **Setup Client:**
   ```bash
   cd ../client
   npm install
   npm run dev
   # Web application open at: http://localhost:5173
   ```

---

## 📚 Living Documentation Index

* [`PROJECT_STATE.md`](PROJECT_STATE.md) — Architectural state audit and runtime environment checks.
* [`PLAN.md`](PLAN.md) — Master production delivery roadmap and phase checklists.
* [`SECURITY.md`](SECURITY.md) — STRIDE threat modeling, trust boundaries, and OWASP countermeasures.
* [`SECURITY_REPORT.md`](SECURITY_REPORT.md) — Offensive red-team penetration audit record.
* [`DECISIONS.md`](DECISIONS.md) — Architecture Decision Records (ADRs) explaining trade-offs.
* [`PROJECT_REPORT.md`](PROJECT_REPORT.md) — Academic report on $0 free-tier substitution vs commercial platforms.
* [`LICENSE`](LICENSE) — Open-source MIT License.
* [`TERMS.md`](TERMS.md) & [`PRIVACY.md`](PRIVACY.md) — Production legal terms and user privacy policy.

---

<div align="center">
Built with ❤️ using Open Source Software & Free Cloud Infrastructure.
</div>
