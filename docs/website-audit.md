# Website audit

The previous customer UI audit and verified responsive findings are in [PREMIUM_AUDIT.md](../PREMIUM_AUDIT.md). This file tracks the broader mission without duplicating that audit.

| Surface | Status | Finding |
| --- | --- | --- |
| Customer Explore (`/`) | Verified | Public search, cards, filters, detail dialog, calendar and both locales were browser-checked at 390/768/1440px in the previous batch. |
| Customer Trips (in-page) | Inspected | API-driven booking actions; live authenticated visual verification remains. |
| Customer Host (in-page) | Inspected | API-driven listing form and list; live authenticated visual verification remains. |
| Customer authentication modal and account | Implemented; targeted verification | Registration redirects to email activation. Account menu uses the API name/initial; profile, recovery and logout are connected. Live email delivery and signed-in end-to-end checks remain. |
| Admin login, recovery, account, dashboard, bookings, catalog, locations, team, pricing | Not inspected | Separate frontend repository; route inventory found, page-by-page review pending. |
| Backend auth | Implemented; targeted verification | Customer activation, recovery, profile, password change and logout contracts added with API tests. Real provider delivery remains unverified. |

The customer app is Next.js 16 with one page route and same-origin auth/backend proxies. The API is NestJS/Mongoose. The separate admin frontend is Next.js. Existing customer changes are uncommitted and must be preserved.

## Route status

| Route or view | Status | Evidence or next check |
| --- | --- | --- |
| Customer `/` Explore | Verified | Public UI, filters, calendar, details, locale and responsive layouts checked in browser. |
| Customer `/` Trips | In progress | Signed-in empty/loading layout checked at 390/768/1440px with a mocked session; real booking mutations pending. |
| Customer `/` Host | In progress | Signed-in listing form/empty layout checked at 390/768/1440px with a mocked session; real listing mutation pending. |
| Customer `/activate` | Implemented | Arabic/English code-to-success browser flow checked with mocked API at 390/1440px; provider delivery pending. |
| Customer `/forgot-password` | Implemented | Mocked three-step browser flow checked at 390/1440px; provider delivery pending. |
| Customer `/profile` | Implemented | Mocked read/update and verified-email badge checked at 390/1440px; live account check pending. |
| Admin `/login`, `/forgot-password` | Verified | Production build and Arabic browser render checked at 390/1440px without overflow or JavaScript errors. Live authentication and email delivery remain separate checks. |
| Admin `/`, `/account`, `/bookings`, `/catalog/units`, `/catalog/unit-categories`, `/catalog/currencies`, `/locations/countries`, `/locations/cities`, `/team/admins`, `/team/admins/[id]`, `/settings/pricing` | Not inspected | Separate admin frontend; route inventory completed, page-by-page code and visual review pending. |

The admin frontend already has a separate token-based design system, bilingual auth, route protection and extensive automated tests. Its unit suite passed 178 tests in 16 files; typecheck and production build passed during this audit. No admin code was changed.
