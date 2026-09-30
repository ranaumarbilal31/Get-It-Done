# Architecture & Platform Decisions (ADR)

**Project:** TaskConnect  
**Date:** September 30, 2026  
**Status:** Accepted  

---

## 1. Hosting Architecture: Decoupled SPA + Stateful Web Service

### Decision
- **Frontend:** React + Vite SPA hosted on **Vercel** (Hobby Plan).
- **Backend:** Node.js + Express + Socket.IO hosted on **Render** (Free Web Service).
- **Database:** Serverless PostgreSQL on **Neon.tech** (Free Tier).

### Rationale
- **WebSockets Requirement:** Real-time chat and notifications use Socket.IO, which requires a persistent stateful connection (or long-polling session affinity). Vercel serverless functions terminate execution after request completion, making persistent WebSocket connections unviable on pure serverless.
- **Render Web Service:** Render's free tier provides 750 hours/month and natively supports persistent WebSocket/HTTP connections.
- **Database Longevity:** Render's free Postgres instance expires in 30 days. Neon's free tier provides permanent storage (0.5 GB) that never expires, with scale-to-zero compute that wakes in ~500ms.

### Plan B Fallbacks
- **Frontend Plan B:** **Netlify** or **Cloudflare Pages** (both offer generous free static hosting).
- **Backend Plan B:** **Railway** (trial/credits) or **Fly.io** (free allowance / container).
- **Database Plan B:** **Supabase** (Postgres free tier; needs periodic heartbeat query to avoid 7-day inactivity pause).

---

## 2. Geolocation & Maps: Leaflet.js + OpenStreetMap vs. Google Maps

### Decision
- Use **Leaflet.js** with **OpenStreetMap** tile layers and custom SVG marker icons.

### Rationale
- **Zero Cost & Zero Billing Risk:** Google Maps Platform charges $7/1,000 loads after the $200 monthly credit and requires a mandatory credit card on file. OpenStreetMap raster tiles are 100% free with no credit card requirement.
- **Customizability:** Leaflet allows custom HTML/SVG pins (such as interactive price tags `$180` and coordinate pickers) without paying for premium Google Maps marker styling.

### Plan B Fallback
- **MapLibre GL JS** with free vector tiles from **MapTiler** or **Protomaps**.

---

## 3. Storage: Cloud Object Storage (Cloudinary / Supabase) vs. Local Disk

### Decision
- Provide multi-tier upload adapter:
  1. Primary: **Cloudinary** / **Supabase Storage** for persistent cloud asset storage.
  2. Fallback: Base64 data URI storage in DB for zero-config zero-dependency testing.
  3. Development: Local `/uploads` for offline local development.

### Rationale
- Render free tier containers feature an ephemeral filesystem. Any files saved to `server/uploads` are deleted when the instance sleeps or redeploys. Persistent external storage is mandatory for production.

---

## 4. Security Architecture & Threat Mitigation

### Decision
- Implement defense-in-depth:
  - **Helmet** for HTTP security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options).
  - **express-rate-limit** for brute-force mitigation on authentication and high-frequency endpoints.
  - **Zod** schema validation middleware on all incoming request bodies and query parameters.
  - **Argon2 / Bcrypt** (cost factor 10+) for secure password hashing.
  - **CORS Allowlist**: Explicitly restrict allowed origins to client production URL and localhost in development.

### Plan B Fallback
- In-memory rate limiting can be upgraded to Redis / Upstash (free tier) if distributed instances are introduced.
