# 🛡️ Get It Done — Security Verification

Source review and local verification on October 7, 2026. This is not external penetration testing or certification.

| Priority | Implemented control                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | JWT socket handshake, server-derived identity, explicit origin allowlist and task-participant authorization                                         |
| Critical | Financial transactions use integer cents, status/revision comparisons and unique ledger keys; repeated/competing settlement cannot duplicate payout |
| High     | Disputes freeze payments; admin-only release/refund/split, written decisions, evidence and audit records                                            |
| High     | Activation/reset tokens are hashed, expiring and single-use; resend invalidates older tokens                                                        |
| High     | Password reset/change increments session version and disconnects user sockets; REST and socket actions reject revoked versions                      |
| High     | Narrow public profile selection; private drafts, delivery/evidence/payment data omitted from public HTML; private responses use no-store            |
| High     | Private persisted identity submissions and authorized document access; no public local identity-file URLs                                           |
| Medium   | Signed relay: HMAC, ±60-second timestamp, allowed templates/origin, bounded payload, TLS SMTP and generic recovery responses                        |
| Medium   | Auth/API request limits, input validation, duplicate-submit locks, session initialization, stale-request cancellation and retries                   |

## Evidence

**106 backend/security tests**, **5 metadata tests** and **17 production Chromium tests** passed locally. Disposable SQLite databases isolate external effects. Tests cover fee boundaries, fractional cents, offer refunds, authorization, repeated/concurrent settlement, dispute locks, partial/refund outcomes, legacy reconciliation, token expiry/replay, recovery, profile privacy and socket impersonation/rooms/messages. Email-relay tests reject unsigned, expired, repeated and arbitrary-template requests. Local capture does not prove inbox delivery.

## Boundaries and operator dependencies

- Gmail live delivery is pending the owner’s app password and shared relay secret. Never commit or expose secrets through frontend variables.
- Recovery responses are generic to reduce account enumeration; provider acceptance does not guarantee inbox placement. Registration exposes delivery failure.
- Rate limits and relay replay suppression are process/instance-local. A shared durable limiter/replay store is appropriate for horizontal scaling.
- The immutable ledger is enforced by application operations and unique keys; database administrators retain database access. There is no external tamper-evident audit service.
- Financial APIs currently simulate provider operations. No real custody, settlement, withdrawal or card processing exists.
- PostgreSQL deployment configuration exists, but backup/retention guarantees require provider confirmation. Production schema additions run without destructive acceptance; back up before release.
- Synthetic staging accounts/reviews are private and Git-ignored. They must never be represented as real customer experiences.
- Runtime dependency audits run in CI; development/build-chain advisories need separate review.
- No government, financial-compliance, background-check or bank-grade security claim is made.
