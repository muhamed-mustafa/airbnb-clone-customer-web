# Redesign progress

## Initial audit — in progress
- Customer repo had uncommitted ULFA branding/UI work; API and admin repos were clean. No reset/stash/commit/push performed.
- Customer `/` and its Explore, Trips, Host, authentication, booking detail and filter states inventoried. Admin route names inventoried; detailed inspection pending.
- API contract audit found customer login, immediate-token registration, refresh and claims-only `GET /auth/me`; admin has separate email-code password recovery.
- Critical findings: signed-in account pill displays a literal M; customer logout clears cookie without revoking backend refresh token; customer profile, activation and recovery contracts are absent.
- Next: inspect backend entities/repositories, implement a coherent account/session batch, verify it, then continue the wider audit.

## Prior ULFA batch
- See [PREMIUM_AUDIT.md](../PREMIUM_AUDIT.md) for completed customer branding and responsive QA.

## Customer identity and account batch
- Preserved earlier uncommitted ULFA work. No reset, stash, commit or push was performed.
- Replaced the fixed account initial with an API-backed name/avatar menu and explicit profile/logout controls.
- Added profile read/name update, password change and refresh-token revocation on logout.
- Added an API-backed verified-email status badge to the profile instead of implying all accounts are verified.
- Added bilingual customer password recovery and email activation pages with same-origin BFF routes.
- Registration now returns a pending account without a session. Activation issues the session; legacy accounts remain active.
- A production API startup check caught an ambiguous Mongoose date field. The schema now declares `Date` explicitly and has a regression test. The rebuilt API started successfully on an isolated port.
- Live user Swagger JSON showed the pending registration response, activation resend/verify routes and profile email-status schema. An invalid activation payload returned HTTP 400. No test account was created.
- Mocked browser checks covered profile, account menu, password recovery and activation at 390px and 1440px without horizontal overflow or browser exceptions. The activation check exercised Arabic, English and code-to-success transitions. Live email delivery remains unverified.
- Signed-in Trips and Host empty/form states were checked with a mocked session at 390px, 768px and 1440px without overflow or browser errors.
- The separate admin app passed 178 unit tests, typecheck and production build. Its login and recovery pages rendered in Arabic at 390px and 1440px without overflow or browser errors; no admin code changed.
- Final API checks: 30 test suites / 131 tests, lint, typecheck, production build, and a live Swagger read passed. Customer lint, typecheck and production build passed. Admin Git tree remains clean.

## Wider mission remaining
- Populated authenticated Trips/Host states and live booking/listing mutations require a test account and isolated data.
- The separate admin frontend's protected routes need page-by-page visual and interaction audit.
- Final cross-browser, keyboard, mobile and real email delivery checks remain before claiming full production readiness.
