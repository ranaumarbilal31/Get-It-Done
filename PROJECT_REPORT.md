> Historical academic project report. Some descriptions predate the October 2026 rebuild. Refer to README, PROJECT_STATE and SEO_AUDIT for current behavior; payments are simulated.

# Get It Done: Technical Architecture & System Engineering Report

**Author:** Get It Done Engineering Team  
**Focus:** Two-Sided Marketplace System Architecture, Real-Time Event Systems & High-Assurance Financial Escrow  
**Platform:** Get It Done Commercial Platform

---

## Executive Summary

**Get It Done** is an enterprise-grade, peer-to-peer task and local services marketplace engineered to support the complete operational lifecycle of modern on-demand service platforms. The platform delivers high-performance web applications with real-time capabilities, interactive geolocation mapping, bank-grade escrow payment pre-authorizations, and rigorous administrative KYC identity verification.

This report evaluates the core system architecture, details the technical design decisions across the stack, and outlines the platform's security, data model, and deployment infrastructure.

---

## 1. System Architecture & Component Design

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
              |   DATABASE    |   |    ESCROW     |   |     EMAIL     |
              |  Prisma ORM   |   | Payment Gate- |   |  Nodemailer   |
              | PostgreSQL /  |   | way & Internal|   | SMTP Delivery |
              | Neon.tech     |   | Ledger Engine |   | Engine        |
              +---------------+   +---------------+   +---------------+
```

### 1.1 Frontend Architecture

- **React 18 & Vite**: Provides instant hot-module replacement (HMR), tree-shaken production bundles, and optimized asset splitting.
- **Tailwind CSS**: Utility-first styling framework delivering a responsive, accessible interface with zero runtime CSS overhead.
- **Leaflet & React-Leaflet**: Native OpenStreetMap raster integration supporting interactive coordinate pin placement, geocoding lookups, and multi-marker map bounds with custom price badge overlays.
- **Context State Management**: Decoupled contexts (`AuthContext`, `SocketContext`, `NotificationContext`) eliminate unnecessary re-renders while coordinating global session state and live alerts.

### 1.2 Backend Architecture

- **Express Server**: REST API handling authentication, CRUD operations, proposal bidding, mutual reviews, and administrative moderation.
- **Socket.IO Engine**: Real-time bi-directional WebSocket connection co-hosted on the HTTP server, enabling instant private messaging rooms (`task_{taskId}`) and user notification channels (`user_{userId}`).
- **Prisma ORM**: Type-safe database queries with support for SQLite in offline development and PostgreSQL (Neon / Supabase) for cloud deployment.

---

## 2. Platform Feature Engineering Breakdown

### 2.1 Identity Verification & KYC ("Verified Tasker" Badge)

| Dimension              | Engineering Implementation                                                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Service Model**      | **Administrative KYC Document Verification Engine**                                                                                                                                                                                                       |
| **Storage & Security** | AES-256 encrypted storage with isolated access controls                                                                                                                                                                                                   |
| **Workflow**           | Service providers upload government-issued photo identification (Driver's License or Passport). Compliance administrators inspect submissions within the `/admin` moderation console, validating authenticity before granting the green `Verified` badge. |

---

### 2.2 Payment Protection & Escrow Ledger

| Dimension             | Engineering Implementation                                                                                                                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**      | **Pre-Authorized Payment Gateway + Transactional Database Ledger**                                                                                                                                                                                                                       |
| **Transaction Guard** | Atomically managed via Prisma `$transaction` across task and payment tables                                                                                                                                                                                                              |
| **Execution Flow**    | 1. Upon offer acceptance, state moves to `HELD_IN_ESCROW`.<br>2. A pre-authorized Payment Intent is secured.<br>3. Upon client inspection and satisfaction confirmation, funds are captured and disbursed to the tasker's digital wallet, retaining a standard 10% platform service fee. |

---

### 2.3 Maps, Geocoding & Location Discovery

| Dimension          | Engineering Implementation                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mapping Engine** | **Leaflet.js + OpenStreetMap (OSM)**                                                                                                               |
| **Capabilities**   | Global coordinate lookups, custom SVG price badges, interactive map dragging, radius filtering, and reverse geocoding without external API quotas. |

---

### 2.4 Real-Time Communications & Messaging

| Dimension        | Engineering Implementation                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Engine**       | **Socket.IO WebSockets Server**                                                                                                    |
| **Capabilities** | Bi-directional room subscriptions, live typing indicators, online presence broadcasting, and instant unread notification counters. |

---

### 2.5 Transactional Notifications

| Dimension        | Engineering Implementation                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Engine**       | **SMTP Delivery Adapter / Nodemailer**                                                                                         |
| **Capabilities** | Automated notifications for user registrations, bid submissions, escrow pre-authorizations, and direct client support routing. |

---

## 3. Database Schema & Relational Integrity

The relational schema is maintained through Prisma. Key data models and their relational constraints include:

```
+---------------+       1:N       +---------------+       1:N       +---------------+
|     User      | --------------< |     Task      | --------------< |     Offer     |
+---------------+                 +---------------+                 +---------------+
  - id (UUID)                       - id (UUID)                       - id (UUID)
  - name                            - posterId (FK)                   - taskId (FK)
  - email (Unique)                  - categoryId (FK)                 - taskerId (FK)
  - role (USER/ADMIN)               - budget                          - amount
  - isVerified                      - status                          - message
  - walletBalance                   - latitude, longitude             - status (PENDING/
  - ratingAvg                       - images (JSON)                             ACCEPTED)
+---------------+                 +---------------+                 +---------------+
        |                                 |                                 |
        | 1:N                             | 1:1                             |
        v                                 v                                 |
+---------------+                 +---------------+                         |
|    Review     |                 |    Payment    | <-----------------------+
+---------------+                 +---------------+
  - id (UUID)                       - id (UUID)
  - taskId (FK)                     - taskId (FK, Unique)
  - reviewerId (FK)                 - amount
  - revieweeId (FK)                 - platformFee (10%)
  - rating (1-5)                    - status (HELD_IN_ESCROW / RELEASED)
  - comment                         - stripePaymentIntentId
```

### Relational Integrity Rules:

1. **Cascade Deletion**: When a task is deleted by its poster, associated offers, payments, and messages are automatically cleaned up to prevent orphaned records.
2. **Atomic State Transitions**: Accepting an offer triggers a Prisma `$transaction` that:
   - Sets the target offer to `ACCEPTED`.
   - Sets all competing offers on that task to `REJECTED`.
   - Changes the task status to `ASSIGNED`.
   - Creates the `HELD_IN_ESCROW` Payment record.
   - Dispatches a real-time notification to the tasker.
3. **Rating Recalculation**: Submitting a review recalculates the reviewee's `ratingAvg` and increments `ratingCount` within the same transaction.

---

## 4. Security & Authentication Architecture

### 4.1 Token Authentication & Session Management

- **Implementation**: Standard **JWT (JSON Web Tokens)** combined with secure **HttpOnly cookies** and `Authorization: Bearer <token>` headers.
- **Defense Profile**: Immune to Cross-Site Scripting (XSS) extraction via HttpOnly cookies while supporting flexible client integrations.

### 4.2 Role-Based Access Control (RBAC)

- All protected endpoints are verified via `middleware/auth.js`.
- Administrative endpoints (`/api/admin/*`) are safeguarded by `requireAdmin`, enforcing strict 403 Forbidden responses to unauthorized accounts.

---

## 5. Cloud Infrastructure Architecture

| Layer        | Provider      | Architecture                                                                                    |
| ------------ | ------------- | ----------------------------------------------------------------------------------------------- |
| **Frontend** | **Vercel**    | Global CDN edge network serving the optimized React 18 SPA with automated SSL and edge routing. |
| **Backend**  | **Render**    | Continuous Node.js web service running Express and persistent Socket.IO WebSockets.             |
| **Database** | **Neon.tech** | PostgreSQL 18.6 managed database with high-availability connection pooling.                     |

---

## 6. Conclusion

**Get It Done** demonstrates a production-grade, highly secure two-sided services marketplace. By pairing React, Vite, Tailwind, Express, Prisma, Leaflet, and Socket.IO with bank-grade escrow locking and administrative KYC moderation, the platform delivers an exceptional, trusted experience for posters and service professionals alike.
