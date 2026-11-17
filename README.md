# Sakan Customer Web

A bilingual customer web app for exploring stays, requesting bookings, and managing guest or host activity.

## Local development

Use Node 24 and pnpm 11. Run the NestJS API on http://localhost:3000, then run:

    pnpm install
    cp .env.example .env.local
    pnpm dev

Open http://localhost:4200. Set SESSION_SECRET to a random value of at least 32 characters.

## Features

- Search published stays by title, price, and type.
- View stay details and request live availability and a tax-inclusive price quote.
- Sign up and log in through a same-origin backend-for-frontend. Access and refresh tokens are sealed in an HttpOnly cookie.
- Request a booking, review trips as a guest or host, and publish, pause, or delete a host listing.
- Arabic RTL and English LTR layouts, responsive presentation, keyboard focus, loading and empty states, and reduced-motion support.

The booking list and host listing endpoints are available on the API's feat/bookings branch. Merge and deploy that branch before using those flows against API main.

Run the checks from the repository root:

    pnpm typecheck
    pnpm lint
    pnpm build
