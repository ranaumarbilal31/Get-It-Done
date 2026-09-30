# TaskConnect — An Airtasker-Style Task Marketplace

A full-featured clone of Airtasker's core functionality, engineered entirely with free/open-source tools and free-tier services — designed for a student budget of **$0**.

---

## 1. Project Overview

TaskConnect is a two-sided community marketplace connecting **Posters** who need jobs done with verified local **Taskers** who quote, complete tasks, and earn money safely through escrow.

### Core Features Implemented
1. **User Authentication & Profiles**: Secure JWT auth with bcrypt password hashing, session persistence, user profiles with avatars, bios, and ratings.
2. **Task Creation & Discovery**: Post tasks with budgets, due dates, categories, photo attachments, and interactive **Leaflet / OpenStreetMap** coordinate selection.
3. **Task Search & Map Exploration**: Browse tasks with real-time keyword search, category filter, budget min/max, in-person vs. remote filters, and interactive map pins with price badges.
4. **Bidding & Offers**: Taskers submit quotes with custom pricing and proposal messages; Posters compare bids and inspect tasker verification badges and reviews.
5. **Simulated Escrow Payment System**: When an offer is accepted, funds are authorized and held in platform escrow (Stripe Test Mode simulation). Funds are only released to the tasker's platform wallet once the poster approves completion.
6. **Real-time Chat**: Bi-directional in-app chat rooms per task powered by **Socket.IO WebSockets** with instant messaging and live typing indicators.
7. **In-App & Email Notifications**: Live pop-in notification toasts and badge counters for new offers, accepted bids, chat messages, and completion milestones (with Nodemailer SMTP / Brevo integration).
8. **Reviews & 5-Star Ratings**: Mutual ratings and text reviews upon task completion that automatically recalculate the tasker's average score.
9. **Mock Identity KYC Verification**: Users upload photo IDs; administrators review documents in the moderation dashboard and approve the official green "Verified Tasker" badge.
10. **Admin Moderation Center**: Overview platform KPIs (Users, Tasks, Escrow Volume), review pending KYC documents, and moderate accounts.

---

## 2. Zero-Cost Free-Tier Tech Stack

| Layer | Commercial / Paid Standard | TaskConnect Free-Tier Substitution | Why & Academic Rationale |
|---|---|---|---|
| **Frontend** | React / Next.js | **React 18 + Vite + TailwindCSS** | High-performance, rapid DX, modern component architecture. |
| **Backend** | Node.js / NestJS / Go | **Node.js + Express + Prisma ORM** | Clean REST API, typed database operations, zero hosting friction. |
| **Database** | Paid AWS RDS / CockroachDB | **SQLite (local zero-config) + PostgreSQL (Prisma)** | Works offline out of the box with zero setup; seamless switch to Neon/Supabase in production. |
| **Maps & Geo** | Google Maps Platform ($$$) | **Leaflet.js + OpenStreetMap** | 100% free tiles with zero API key billing limits or credit card requirements. |
| **Real-Time** | Pusher / Ably / PubNub | **Self-hosted Socket.IO (WebSockets)** | Unlimited concurrent message volume on standard HTTP server port. |
| **Payments / Escrow**| Stripe Connect Live | **Stripe Test Mode + Platform Ledger** | Fully simulates authorization, escrow hold, and capture without financial liability or legal setup. |
| **ID Verification** | Onfido / Jumio KYC ($$$) | **Mock Admin KYC Review Panel** | Users upload real ID photos; admins approve/reject to award verified badge. |
| **Email Service** | SendGrid / Mailgun ($$$) | **Nodemailer + Brevo Free / Console Fallback** | 300 free emails/day on Brevo; development logs ensure zero crash risk. |
| **Storage** | AWS S3 buckets | **Local `/uploads` + Cloudinary Free Tier** | Zero-cost multi-part image and document storage. |

---

## 3. Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Launch

1. **Install Server Dependencies & Initialize Database**:
   ```bash
   cd server
   npm install
   npx prisma db push
   node prisma/seed.js
   ```

2. **Start Backend Server**:
   ```bash
   npm start
   # API runs at: http://localhost:5000
   # WebSocket runs on: ws://localhost:5000
   ```

3. **Install Client Dependencies & Launch Frontend**:
   ```bash
   cd ../client
   npm install
   npm run dev
   # Web app opens at: http://localhost:5173
   ```

---

## 4. Pre-Configured Demo Accounts (1-Click Fill)

The seed script (`prisma/seed.js`) automatically populates test users with pre-loaded tasks, bids, reviews, and escrow records:

| Role | Email | Password | Description |
|---|---|---|---|
| **Administrator** | `admin@taskconnect.com` | `Password123!` | Accesses `/admin` to approve ID verifications, monitor escrow KPIs. |
| **Poster** | `sarah@example.com` | `Password123!` | Publishes tasks, reviews offers, and approves completed work. |
| **Verified Tasker** | `alex@example.com` | `Password123!` | 5-star flatpack assembler with verified badge and wallet earnings. |
| **Verified Tasker** | `elena@example.com` | `Password123!` | End-of-lease cleaner with 20+ reviews. |
| **Pending KYC User** | `jessica@example.com` | `Password123!` | Submitted driver license awaiting admin approval in KYC queue. |

> **Pro Tip:** On the `/login` page, click any of the **Quick Demo Login** buttons for instant 1-click authentication!

---

## 5. Deployment Options (100% Free)

- **Frontend**: Deploy `/client` to **Vercel** or **Netlify** with `npm run build`.
- **Backend**: Deploy `/server` to **Render.com** or **Railway.app** as a free web service.
- **Cloud Database**: Create a free PostgreSQL instance on **Supabase** or **Neon.tech**, rename `schema.postgresql.prisma` to `schema.prisma`, and configure `DATABASE_URL`.

---

## 6. Project Architecture

```
G-Air/
├── client/                     # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── api/client.js       # Axios client with JWT interceptor
│   │   ├── components/         # Navbar, TaskCard, TaskMap, MapPicker, Badges
│   │   ├── context/            # AuthContext, SocketContext, NotificationContext
│   │   ├── pages/              # Home, BrowseTasks, TaskDetail, PostTask, Profile, Admin
│   │   ├── App.jsx             # Main routing hub
│   │   └── main.jsx
├── server/                     # Node.js + Express API Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma data model (compatible with SQLite/Postgres)
│   │   └── seed.js             # Seeder with categories, test users, tasks, and offers
│   ├── src/
│   │   ├── controllers/        # Auth, Task, Offer, Message, Review, Admin
│   │   ├── middleware/         # JWT auth, upload (Multer), error handler
│   │   ├── routes/             # RESTful API endpoints
│   │   ├── services/           # Payment/Escrow simulation & Email service
│   │   ├── sockets/            # Real-time chat & typing handlers
│   │   └── server.js           # Express + HTTP + Socket.IO bootstrap
├── PROJECT_REPORT.md           # Academic engineering report & trade-off analysis
└── README.md                   # This documentation
```
