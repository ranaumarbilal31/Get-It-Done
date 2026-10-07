# Security Model

Get It Done is a demonstration marketplace. Authentication, authorization, validation and privacy controls are implemented, but their presence does not establish commercial readiness or regulatory compliance.

## Trust boundaries

- Visitors receive sanitized public task data and selected public profile fields.
- Account operations require authentication; administrative endpoints additionally require the ADMIN role.
- Task chat is restricted to the poster and hired tasker. Socket identity is derived from a verified token.
- Identity documents are served through authorized administrative inspection. New submissions are private database data, and legacy local document paths are blocked from public static serving.
- Email and cloud asset delivery depend on the operator's configuration. Payment flows remain simulated.

## Controls

JWT verification, password hashing, Zod validation, ownership checks, origin restrictions, Helmet headers, rate limits, bounded uploads, and explicit error responses are part of the source implementation. Automated tests cover representative positive and negative scenarios; they do not prove comprehensive immunity.

See [SECURITY_REPORT.md](SECURITY_REPORT.md) for the October 7, 2026 findings, dependency limitations, and remaining production work.

## Reporting

Email [ranaumarbilal31@gmail.com](mailto:ranaumarbilal31@gmail.com) with reproducible details and affected routes. Do not send passwords or identity documents. No response SLA or bounty is promised.
