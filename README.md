# Tiny Threads

A responsive kids' clothing store built with Next.js (App Router), Supabase Postgres and Stripe Checkout.

- **Shop:** homepage with featured products and categories, product listings with search, filters, sort and pagination, and product pages with a gallery, options, live price and stock, and add to cart.
- **Cart and checkout:** cart with quantity changes, delivery and tax totals, free delivery over a threshold, then checkout as a guest (email required) or with an account (saved addresses).
- **Payments:** the database prices and reserves the order, Stripe hosted Checkout takes the payment, and a signed webhook marks it paid. Orders always end up in one clear state: paid, payment failed, or canceled, with stock released when payment doesn't happen.
- **Accounts:** sign up, sign in (email or Google), sign out, password reset, order history and saved addresses. A guest cart carries over when the shopper signs in.

## Getting started

Follow [docs/setup-guide.md](docs/setup-guide.md) to create the Supabase project, Stripe test keys and `.env.local`. Then:

```bash
npm install
npm run dev
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build and serve |
| `npm test` | Unit and component tests (Jest) |
| `npm run test:e2e` | Browser tests (Playwright), see [docs/testing.md](docs/testing.md) |
| `npm run lint` / `typecheck` | ESLint and TypeScript |
| `npm run stripe:listen` | Forward Stripe test webhooks to the local app |

## Layout

```
supabase/            schema migration, seed data, SQL tests
src/app/             routes (pages, Stripe webhook, auth callback)
src/features/        domain logic: catalog, cart, checkout, payments, orders, auth, account, email
src/components/      UI building blocks and feature components
src/lib/             env parsing, Supabase clients, money helpers
e2e/                 Playwright tests and the fake Stripe server they use
docs/                plan, setup guide, testing notes
```

How the pieces fit together, including guest vs account checkout and the payment states, is in [docs/implementation-plan.md](docs/implementation-plan.md).
