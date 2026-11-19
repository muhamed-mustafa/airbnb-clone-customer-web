# Customer authentication audit

| Flow | Customer UI | API contract | Verification |
| --- | --- | --- | --- |
| Login | Bilingual modal with validation, password reveal and loading | `POST /api/auth/login`; pending accounts receive `CUSTOMER_EMAIL_NOT_VERIFIED` and go to `/activate` | API unit tests; live account check pending |
| Registration | Modal redirects to `/activate?email=…` | `POST /api/auth/register` creates a pending account and returns `{ email, verificationRequired: true }`; no tokens | API unit/HTTP tests; live email pending |
| Email activation | Bilingual `/activate` with code, resend, countdown, error and success states | `POST /api/auth/activation/resend` and `/verify`; code expires in 10 minutes, 60-second resend cooldown, five wrong attempts, one use | API unit/HTTP/Swagger tests and mocked mobile/desktop browser flow; live email pending |
| Logout | Account menu and profile control | `POST /api/auth/logout` revokes refresh token; BFF clears HttpOnly cookie | API tests and signed-in browser mock |
| Session | Sealed cookie, proxy refresh on 401 | `POST /api/auth/refresh-token`; `GET /api/auth/me` returns claims | Live expiry/back-navigation pending |
| Forgot/reset password | Bilingual three-step `/forgot-password` route | Request/verify/complete endpoints with one-use code/token and refresh revocation | API tests and mocked browser flow; live email pending |
| Profile/edit/change password | Protected `/profile` route with a verified-email status badge | `GET/PATCH /api/users/me` returns account status; `PATCH /api/auth/me/password` | API tests and mocked browser flow at 390px/1440px |

Existing accounts without `emailVerifiedAt` remain active. New accounts explicitly store `null` until activation. Customer activation and recovery require `RESEND_API_KEY` and `AUTH_EMAIL_FROM`; a configured sender and real mailbox have not been verified here. Provider delivery errors are logged while the public resend response stays generic, so production email delivery needs an end-to-end check before release. Registration intentionally changes the old immediate-token contract; other clients must adapt.
