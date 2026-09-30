# TaskConnect Security Policy & Threat Model

**Document Version:** 1.0.0  
**Effective Date:** September 30, 2026  
**Status:** Active  

---

## 1. Vulnerability Disclosure Policy

If you discover a security vulnerability within TaskConnect, please disclose it responsibly by contacting the maintainers directly or opening a confidential security advisory on GitHub. Please do **not** disclose security vulnerabilities publicly until they have been reviewed and addressed.

---

## 2. STRIDE Threat Model

```
+---------------------------------------------------------------------------------+
|                                 TRUST BOUNDARY 1                                |
|   Public Internet / Untrusted Client Browser (Attacker / Normal User / Bot)     |
+---------------------------------------+-----------------------------------------+
                                        |  HTTPS / WSS (TLS Encryption)
                                        v
+---------------------------------------------------------------------------------+
|                                 TRUST BOUNDARY 2                                |
|   Reverse Proxy / Helmet Headers / Rate Limiters (120 req/min API, 15/15m Auth) |
+---------------------------------------+-----------------------------------------+
                                        |  Validated Request Body (Zod)
                                        v
+---------------------------------------------------------------------------------+
|                                 APPLICATION CORE                                |
|   Express Controllers + Socket.IO Handlers + JWT Authenticator + RBAC Guard     |
+---------------------------------------+-----------------------------------------+
                                        |  Parameterized ORM (Prisma)
                                        v
+---------------------------------------------------------------------------------+
|                                 DATA STORAGE                                    |
|   PostgreSQL / SQLite Database + Cloudinary Cloud Object Store                  |
+---------------------------------------------------------------------------------+
```

### STRIDE Assessment Matrix

| Threat Category | Potential Attack Vector | TaskConnect Defensive Countermeasure |
|---|---|---|
| **Spoofing** | Forged JWT token or fake identity claims. | Signed JWT with strong secret key; server validates user existence in DB on every request (`middleware/auth.js`). |
| **Tampering** | Injected malicious payload in task budget or malicious SQL string. | **Zod schema validation** rejects malformed payloads; **Prisma ORM** enforces strict parameterized queries across all database operations. |
| **Repudiation** | Denying an escrow payment release or bid acceptance. | Atomic database transactions (`$transaction`) maintain an immutable state machine: `OPEN` -> `ASSIGNED` -> `COMPLETED`. |
| **Information Disclosure** | Sensitive user data or password hashes leaked via API. | Strict Prisma `select` projections omit `password` hashes and sensitive tokens from all user and task API responses. |
| **Denial of Service** | Credential stuffing or flooding API endpoints. | **express-rate-limit** throttles auth endpoints to 15 attempts/15 min and general API to 120 requests/min; JSON payload body limit capped at 10 MB. |
| **Elevation of Privilege** | Normal user calling `/api/admin/*` to approve ID or view disputes. | Strict `requireAdmin` middleware checks `req.user.role === 'ADMIN'`, responding with `403 Forbidden` if unauthorized. |

---

## 3. OWASP Top 10 Defenses & Implementation Details

### A01: Broken Access Control
- **IDOR Protection:** Only the task poster can accept offers or mark completion. Only the offer author can withdraw an offer.
- **Admin Guards:** Administrative routes are protected by `requireAdmin` middleware and return 403 Forbidden on violation.

### A02: Cryptographic Failures
- **Password Storage:** Passwords hashed with salted **Bcrypt** (cost factor 10).
- **Transport Security:** Production traffic enforced over HTTPS/TLS. Sensitive tokens never stored in plain text in logs.

### A03: Injection
- **SQL Injection:** 100% prevented via Prisma ORM parameterized queries. No raw string-concatenated SQL queries exist in application routes.
- **Input Validation:** Zod schemas enforce types, regex, length constraints, and remove unrecognized parameters before execution.

### A04: Insecure Design
- **Escrow State Machine:** Funds cannot be released unless the task status is currently `ASSIGNED` and an accepted offer exists.
- **Self-Bidding Prevention:** Users are explicitly forbidden from submitting bids on tasks they posted.

### A05: Security Misconfiguration
- **HTTP Security Headers:** **Helmet** configured with `nosniff`, `SAMEORIGIN` framing, `Referrer-Policy`, and CSP allowlisting OpenStreetMap tiles, Unsplash images, and DiceBear avatars.
- **CORS Allowlist:** Cross-Origin Resource Sharing restricted strictly to authorized origins (`CLIENT_URL` and localhost).

### A06: Vulnerable and Outdated Components
- Regular `npm audit` scanning integrated into development and CI/CD pipelines.

### A07: Identification and Authentication Failures
- Strict rate limiting on `/api/auth/login` (15 attempts per 15 minutes) prevents brute-force password cracking.
- Minimum password length enforced (6+ characters).

### A08: Software and Data Integrity Failures
- Dependencies locked via `package-lock.json`.

### A09: Security Logging and Monitoring Failures
- Centralized error handler logs errors without leaking internal stack traces in production (`NODE_ENV === 'production'`).
- Detailed health-check endpoint (`/api/health`) provides database connectivity and system uptime status.

### A10: Server-Side Request Forgery (SSRF)
- Cloudinary uploads perform signature verification via HMAC-SHA1 timestamps. No arbitrary user-supplied external URLs are fetched server-side without validation.
