# 📍 Get It Done — Current Project State

Updated October 7, 2026.

The marketplace uses React 18, Vite 6, React Router 7, Tailwind CSS 3, Express, Prisma and Socket.IO. Public pages render through Vite SSR and Vercel Node functions; six informational pages also prerender. Leaflet maps initialize only in the browser.

The UI now uses cream backgrounds, charcoal typography, orange accents, shared navigation and accessible dialogs. Homepage, discovery, task details, posting, authentication, profile, administration and informational pages share the same visual system.

Chat identities derive from verified JWTs. Only the poster and hired tasker can read or write task conversations. Public profiles expose an explicit public field list. New identity samples are private database records accessible through an authenticated admin endpoint. Previously uploaded external identity files require operator review and removal from public storage.

Payments, holds, payouts and wallet balances are simulated. Identity badges record an administrative document review; no background check or compliance certification is claimed. Local seed accounts are demonstration data.

See [SEO audit](SEO_AUDIT.md) for measured verification and remaining work, [README](README.md) for setup, and [security report](SECURITY_REPORT.md) for security limitations. No production database migration or seed is part of this update.
