# Redesign plan

1. **Audit and foundation:** inventory all routes and contracts; preserve existing customer design tokens (warm paper, olive, clay), IBM Plex Sans, RTL/LTR and reduced-motion behavior. Record actual visual and API limitations.
2. **Customer navigation/account:** replace the fixed M/logout pill with a real account menu, profile entry and explicit logout action; use API-backed identity. Ensure keyboard, mobile and loading/error states.
3. **Backend customer auth/profile:** add only verified contracts: session revocation, profile read/update and password change. Reuse current Argon2 and refresh-token architecture. Audit customer activation/recovery against admin reset infrastructure before implementing.
4. **Customer auth journeys:** connect supported API contracts to login/register/recovery/activation/profile UI. Do not show dead controls.
5. **Other customer surfaces:** inspect and refine Explore, Trips and Host at mobile/desktop without altering booking/listing business logic.
6. **Admin frontend:** review every discovered route and reuse its existing design system; make focused changes only when a concrete inconsistency or defect is found.
7. **QA:** targeted unit/API tests, typecheck, lint, production builds, browser interactions, keyboard and responsive checks. Mark states Verified only after actual execution.

Acceptance for each batch: no lost user changes; no fake endpoint; visible loading/error/success states; no horizontal overflow or inaccessible controls; relevant checks pass.
