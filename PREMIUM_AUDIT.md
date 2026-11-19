# ULFA customer experience — audit, direction, and verification

## Scope and route inventory
The canonical customer app is `customer-web-publish`, a Next.js App Router application. `/` is the only page route; `/_not-found` is the framework error route. `/api/auth/*` and `/api/backend/*` are server actions/proxies, not visual pages. The page has three in-page views:

| View or state | Existing journey | Design and UX review |
| --- | --- | --- |
| Explore | Destination search, date selection, filters, paginated listings, detail and booking dialog | Shared header and footer, search, calendar, cards, filter sheet and detail dialog reviewed at mobile and desktop sizes. |
| Trips | Guest booking list, edit/cancel, host booking decisions | Code and shared styles reviewed; live signed-in visual verification needs an authenticated account. |
| Host | Listings, publish/unpublish, create listing | Code and shared styles reviewed; live signed-in visual verification needs an authenticated account. |
| Authentication | Sign in, sign up, country picker, validation and feedback | Both modal modes rendered and mobile scroll checked. |
| Error/loading/empty | API errors, skeletons, no-result messages, disabled actions | Existing implementations retained; no new fake actions or placeholders added. |

## Findings before implementation
- Strengths: Arabic RTL and English LTR already work, APIs drive booking and listing actions, image geometry is stable while remote images load, and modal, focus, empty, loading, and reduced-motion styles exist.
- Shared issue: visible name, copy, metadata, and door/star artwork belonged to Rihal while the chosen brand is ULFA. The mixed voice weakened the product identity.
- Explore issue: the previous journey metaphor had less relevance to the feeling of belonging that the new name communicates.
- Maintainability issue: `globals.css` has historical overrides. Consolidating all of them risks unrelated visual regressions, so new changes reuse existing tokens and alter only affected brand rules.
- Verification limit: Trips and Host require a signed-in session; read-only code review cannot replace a live authenticated visual test.

## Design system and implementation order
1. **Foundation** — Update title, description, social metadata, favicon, Arabic/English brand voice. Keep IBM Plex Sans Arabic and Latin, the existing spacing scale, radius scale, ink/olive/paper surfaces, clay accent, and focus treatment. A warm paper `#f7f5f1`, ink `#253129`, muted `#626a63`, and clay `#b45b45` give readable contrast without a new dependency.
2. **Shared chrome** — Use one nested-arch ULFA symbol in navigation, footer, and the auth story; keep the existing responsive navigation and action behavior. Acceptance: the brand remains legible at 390, 768, and 1440px with no horizontal overflow.
3. **Explore and overlays** — Rewrite the hero and footer copy for the new positioning; retain working search, date picker, filter, pagination, detail scrolling, and booking. Acceptance: primary interactions still open and scroll, and `/` does not add a default query string.
4. **Authenticated views** — Preserve bookings and host API flows and the shared brand styling. Acceptance for final live verification: authenticated Trips and Host screens, mutation feedback, and mobile layouts should be checked with a valid session.
5. **Motion** — Keep the restrained entrance and hover transitions and the existing `prefers-reduced-motion` handling. Acceptance: no new transition blocks input or shifts layout.

## Implemented
- Replaced public Arabic/English brand text with **أُلفة / ULFA** and aligned the tagline, hero, footer, and sign-in/sign-up story.
- Replaced the former logo with a compact nested-arch mark, added a matching app icon, and updated metadata and README.
- Tuned brand olive/paper colors using the existing CSS system. Preserved prior uncommitted customer work and API behavior.

## QA performed
- `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd build`, and `git diff --check` passed.
- Rebuilt Next app returned HTTP 200 at `http://localhost:4200/` with ULFA metadata and visible brand.
- Playwright/Chrome at **390, 768, and 1440px** found no horizontal document overflow. At 390px, sign-in and sign-up, the filter sheet, and the date calendar opened; sign-up submit remained reachable after scrolling the dialog. The listing detail overlay scrolled over the gallery by 360px on wheel input. Locale switching produced LTR English text and kept the URL query empty. Browser page errors: none in these checks.
- Remote listing images were lazy-loaded; full-page screenshots taken before scrolling can show image placeholders. After scrolling, all six rendered card images loaded at both 390px and 1440px. The hero image completed in about 0.5 seconds in a separate browser check. This timing is environment-specific, not a production guarantee.

## Remaining verification
A valid signed-in customer/host session is needed to visually inspect Trips and Host and to exercise booking mutations against the API. No credentials or destructive API operations were used in this review. The CSS override history remains a maintainability concern for a future focused cleanup.

