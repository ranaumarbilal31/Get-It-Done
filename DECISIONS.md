# Architecture Decisions — October 7, 2026

1. **Retain the stack.** React 18/Vite/Tailwind, Express, Prisma and Socket.IO preserve the existing marketplace interfaces. React Router is aligned to the installed 7.x version.
2. **Hybrid rendering.** Static informational routes prerender at build time. Public marketplace routes render in Vercel Node functions and hydrate. Maps and private interactions load in the browser. The backend remains stateful for sockets.
3. **Privacy at the boundary.** Public HTML uses unauthenticated sanitized API results and a task-field allowlist. No account data is serialized into server-rendered pages. Utility and public-profile routes are noindex by default.
4. **Shared chat authorization.** REST and sockets use one participant policy. The server derives identity and the counterpart rather than trusting sender IDs.
5. **Honest demonstration.** Payment, wallet and commission flows remain simulations. The UI communicates those limits and removes fake withdrawals, card details and guarantees.
6. **Verification without production mutation.** Backend and browser tests create their own disposable SQLite databases. Operator-provided application databases are never seeded by test runners.
7. **Dependency compatibility.** Runtime advisories are fixed. The remaining Tailwind 3 build-chain advisories are documented pending an appropriate future upgrade; no unsupported transitive version is invented.

See README for deployment settings and SEO_AUDIT for measured results.
