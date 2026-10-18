# Testing

| Command | What it runs |
| --- | --- |
| `npm test` | Jest unit and component tests (pricing, filters, variants, order states, checkout validation, Stripe line items, safe redirects, `Price`, `QuantityStepper`) |
| `npm run test:coverage` | The same with a coverage report |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run test:e2e` | Playwright browser tests against a running app |

## Browser tests

`e2e/shopping.spec.ts` covers browsing with filters, sort and pagination (desktop and mobile), product options, guest checkout that succeeds, is canceled, or fails, checkout field errors, sign-up that keeps the guest cart and saves an address, and protected pages.

They need a running app connected to a Supabase project with the migration and seed applied. Payments go through `e2e/fake-stripe.mjs`, a small stand-in for Stripe Checkout, so no real Stripe account is used:

```bash
STRIPE_WEBHOOK_SECRET=whsec_test node e2e/fake-stripe.mjs &   # listens on :12111 and sends signed webhooks
STRIPE_API_BASE=http://localhost:12111 \
STRIPE_SECRET_KEY=sk_test_fake STRIPE_WEBHOOK_SECRET=whsec_test \
  npm run build && npm start &
npm run test:e2e
```

Use a throwaway Supabase project for this, since the tests create users and orders.

## Database tests

`supabase/tests/checkout_flow.test.sql` exercises the checkout RPCs (pricing, stock reservation, paid, failed, canceled, and the status constraint). See `supabase/tests/README.md`.

## Manual check with real Stripe test mode

1. `stripe login`, then `npm run stripe:listen` and copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
2. `npm run dev`, add items, check out, and pay with `4242 4242 4242 4242` (any future date, any CVC).
3. Try `4000 0000 0000 0002` for a declined card, and the back link on the Stripe page for a canceled payment.
