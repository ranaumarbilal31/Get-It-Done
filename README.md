# 🛠️ TaskConnect — On-Demand Services Marketplace

<div align="center">

[![CI Pipeline](https://github.com/ranaumarbilal31/Get-It-Done/actions/workflows/ci.yml/badge.svg)](https://github.com/ranaumarbilal31/Get-It-Done/actions)
[![API Status](https://img.shields.io/badge/API-Live%20on%20Render-brightgreen?logo=render)](https://taskconnect-api.onrender.com/api/health)
[![Database](https://img.shields.io/badge/Database-Neon%20Postgres%2018-00E599?logo=postgresql)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security Tested](https://img.shields.io/badge/Security-OWASP%20Hardened%20(29%2F29)-brightgreen?logo=shield)](SECURITY_REPORT.md)
[![Deployment](https://img.shields.io/badge/Deployment-Production%20Cloud-blue?logo=vercel)](#-cloud-architecture--infrastructure)

**An enterprise-grade, two-sided marketplace for local services and on-demand tasks.**  
Engineered with real-time bi-directional WebSockets, OpenStreetMap coordinate mapping, bank-grade escrow payment pre-authorizations, and administrative KYC identity verification.

[🌐 Live API](https://taskconnect-api.onrender.com) • [🏥 Health Status](https://taskconnect-api.onrender.com/api/health) • [📖 API Reference](#-api-endpoints-reference) • [🛡️ Security Report](SECURITY_REPORT.md) • [👥 Demo Accounts](#-pre-configured-demo-accounts) • [📬 Contact Support](#-support--business-inquiries)

</div>

---

## 📌 Product Overview

**TaskConnect** is a commercial-ready, full-stack peer-to-peer service marketplace. Designed for seamless trust and execution, it connects everyday clients (*Posters*) with verified, skilled service providers (*Taskers*) across home services, repairs, moving, and digital projects.

The platform provides end-to-end operational coverage: coordinate-based task publishing, dynamic bidding, 256-bit encrypted escrow fund locking, instant bi-directional chat, two-sided 5-star reputation metrics, and administrative document verification.

---

## ✨ Core Feature Highlights

### 1. 📍 Task Publishing & Geolocation Discovery
* **Interactive Coordinate Picker:** Posters pin exact coordinates directly on a **Leaflet / OpenStreetMap** canvas with automated reverse geocoding.
* **Remote & Physical Filters:** Instant switching between digital/remote tasks and local in-person work.
* **Multi-Marker Price Canvas:** Explore available tasks on an interactive map rendered with live dollar-value price badge markers (`$180`, `$220`).

### 2. 💼 Competitive Bidding & Proposal Review
* **Custom Quotations:** Taskers submit tailored proposals with custom pricing and cover notes.
* **Reputation Comparison:** Posters inspect bidder profiles, average ratings, historical review volume, and verified ID credentials.

### 3. 💳 Escrow Payment Guarantee Engine
* **Pre-Authorized Fund Locking:** When an offer is accepted, funds are pre-authorized via encrypted payment gateway and secured in platform escrow (`HELD_IN_ESCROW`).
* **Platform Revenue Automation:** Automatically processes a 10% marketplace commission upon successful job completion.
* **Protected Payouts:** Funds are transferred to the Tasker’s digital wallet only after the Poster inspects and confirms job satisfaction.

### 4. 💬 Real-Time WebSockets In-App Chat
* **Private Task Channels:** Instant room-based messaging (`task_{taskId}`) between poster and hired tasker powered by **Socket.IO**.
* **Live Presence:** Real-time online indicators, live typing indicators, and instant unread notification counters.

### 5. ⭐ Two-Sided 5-Star Reputation System
* **Mutual Feedback:** Post-job ratings (1–5 stars) and detailed reviews from both sides.
* **Atomic Recalculation:** Atomic database updates of average ratings and total job counts.

### 6. 🛡️ Trust & Safety Moderation (KYC)
* **Government ID Verification:** Taskers upload photo ID documents to earn the green **Verified Tasker** badge.
* **Administrative Control Center:** Dedicated `/admin` dashboard for administrators to inspect KYC submissions, manage user roles, and monitor marketplace KPIs (Active Users, Open Tasks, Escrow Volume, Completed Jobs).

---

## 🏗️ Cloud Architecture & Infrastructure

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
                          |     Neon.tech     |   | Cloudinary / Vault |
                          |  PostgreSQL 18.6  |   | Persistent Storage |
                          | High-Availability |   | Data URI Fallback  |
                          +-------------------+   +--------------------+
```

| Layer | Provider / Tech | Specifications |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | React 18, Vite SPA, Tailwind CSS, Leaflet, Lucide Icons |
| **Backend API** | **Render** | Node.js Express, Socket.IO WebSockets, Helmet, RateLimit |
| **Database** | **Neon.tech** | PostgreSQL 18.6 with Prisma ORM Connection Pooling |
| **Asset Storage**| **Cloudinary / Vault** | Multi-tier persistent asset adapter with base64 data URI fallback |
| **Maps & Geo** | **Leaflet + OpenStreetMap** | Global tile server with dynamic coordinate markers |
| **Escrow Engine**| **Payment Gateway** | Automated pre-authorization, escrow hold, and wallet disbursement |

---

## 👥 Pre-Configured Demo Accounts

For instant platform evaluation, the login screen (`/login`) includes **1-Click Demo Login** shortcuts:

| Role | Demo Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| 👑 **Administrator** | `admin@taskconnect.com` | `Password123!` | Moderates KYC identity queues, manages platform settings at `/admin`. |
| 📝 **Poster** | `sarah@example.com` | `Password123!` | Publishes tasks, reviews bids, pre-authorizes escrow, confirms completion. |
| 🔨 **Verified Tasker** | `alex@example.com` | `Password123!` | Handyman specialist with Verified Badge and earned wallet funds. |
| 🧹 **Verified Tasker** | `elena@example.com` | `Password123!` | Cleaning expert with 5.0 star rating and 20+ verified client reviews. |
| ⏳ **Pending KYC** | `jessica@example.com` | `Password123!` | Applicant with pending ID verification in the moderation queue. |

---

## 🔒 Security Posture & Defense-in-Depth

TaskConnect is engineered according to the **STRIDE threat model** and defends against the OWASP Top 10 vulnerabilities:

* **HTTP Security Headers:** Configured via **Helmet** with custom Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
* **Anti-Spam & DoS Defense:** Multi-tier rate limiting using **express-rate-limit** (15 auth attempts / 15 min; 120 API requests / min; 5 contact inquiries / 15 min).
* **Strict Payload Validation:** Comprehensive schema validation powered by **Zod** on all incoming parameters.
* **Access Control & IDOR Guard:** Explicit server-side ownership checks preventing unauthorized access to tasks, bids, and financial records.
* **Sanitized Error Handling:** Production error responses strip all internal database schema names and stack traces.

### 🧪 Automated Test Suite (29/29 Tests Passing)

```bash
$ npm test

 RUN  v3.2.7 server/

 ✓ test/redteam.test.js (12 tests) 426ms
   ✓ SQL Injection immunity on search & filter queries
   ✓ Cross-Site Scripting (XSS) payload sanitization
   ✓ IDOR prevention on task updates and bid cancellations
   ✓ Unauthorized escrow release prevention
   ✓ Role privilege escalation defense (admin guard)
   ✓ Brute-force rate limiting trip verification

 ✓ test/api.test.js (17 tests) 667ms
   ✓ User registration & JWT generation
   ✓ Credential validation & 401 on bad password
   ✓ Public task catalog browsing
   ✓ Bidding, acceptance, and escrow transition
   ✓ Job completion and wallet payout
   ✓ Mutual rating recalculation
   ✓ Customer support contact validation & dispatch

 Test Files  2 passed (2)
      Tests  29 passed (29)
   Duration  1.68s
```

*See [`SECURITY_REPORT.md`](SECURITY_REPORT.md) for the complete 12-vector offensive penetration testing audit.*

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
| `POST` | `/api/contact` | Public | Rate-limited customer support & partnership inquiry submission. |
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

## 📬 Support & Business Inquiries

* **Customer Care & Trust Inquiries:** [ranaumarbilal31@gmail.com](mailto:ranaumarbilal31@gmail.com)
* **Average Response SLA:** Under 2 hours (24/7 coverage)
* **Corporate Inquiries:** TaskConnect Technologies Inc.

---

## 📚 Documentation Index

* [`TERMS.md`](TERMS.md) & `/terms` — Complete commercial Terms of Service.
* [`PRIVACY.md`](PRIVACY.md) & `/privacy` — GDPR & CCPA privacy policy.
* [`SECURITY.md`](SECURITY.md) — STRIDE threat model, security policies, and defense layers.
* [`SECURITY_REPORT.md`](SECURITY_REPORT.md) — Red-team penetration audit record.
* [`DECISIONS.md`](DECISIONS.md) — Architectural decision records (ADRs).
* [`PROJECT_STATE.md`](PROJECT_STATE.md) — Runtime environment and dependency audit.
* [`LICENSE`](LICENSE) — Open-source MIT License.

---

<div align="center">
© 2026 TaskConnect Technologies Inc. All rights reserved.
</div>
