# Next Ecom: implementation plan

A responsive store for mobile accessories built with Next.js (App Router) and Supabase Postgres, following the patterns from the course sessions in this project (server-first data access, `mutate_cart()` cart RPC, saved addresses, order snapshots, Resend, Jest).

Files next to this plan:

- [`supabase/migrations/20261018000000_init.sql`](supabase/migrations/20261018000000_init.sql): tables, view, functions, RLS, grants.
- [`supabase/seed.sql`](supabase/seed.sql): 7 categories, 21 products, 36 variants, images, promotions, delivery methods, store settings.
- [`supabase/tests/`](supabase/tests/README.md): a SQL script that exercises the whole cart → checkout → payment flow and RLS on plain Postgres. It passes on Postgres 16.

## 1. Decisions

| Topic | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 App Router, TypeScript, Tailwind CSS | Matches the course; server components keep catalog and secrets on the server. |
| Data and auth | Supabase Postgres + Supabase Auth via `@supabase/ssr` | Brief requires Supabase as the catalog source. |
| Payment | Stripe Checkout (hosted page) | Card data never touches our app; built-in success and cancel redirects; webhooks for final state. |
| Guests | Supabase anonymous sign-in, created on first add-to-cart | Guests and accounts share one cart, one checkout function and the same RLS. No second code path. |
| Product options | Variants table (`options` jsonb such as Color, Length, Size), stock per variant | PDP needs options; stock has to be per option to be correct. |
| Currency and tax | USD, 8% tax on goods, set in `store_settings` | Placeholder values; change one row. PKR also works with Stripe if preferred. |
| Delivery | Standard $5 (free over $75), Express $15 | Rows in `shipping_methods`. |
| Email | Resend: Supabase Auth SMTP plus an order confirmation email from the webhook | Session 3 setup. |
| Tests | Jest for pure business logic, React Testing Library for components, Playwright for one end-to-end checkout | Session 5 plus one real-browser path. |

## 2. Application structure

```
src/
  app/
    (store)/
      page.tsx                     Homepage: hero promos, categories, featured, new arrivals
      category/[slug]/page.tsx     PLP for one category
      products/page.tsx            PLP for all products and search (?q=)
      products/[slug]/page.tsx     PDP
      cart/page.tsx
      checkout/page.tsx            Contact, address, delivery, summary, Pay button
      checkout/confirmation/page.tsx   ?session_id=  success, or "confirming" while pending
      checkout/canceled/page.tsx   ?order=  shopper backed out of Stripe
      orders/page.tsx              Order history (accounts)
      orders/[number]/page.tsx     Order detail (owner only, via RLS)
      account/page.tsx, account/addresses/page.tsx
    (auth)/
      sign-in/page.tsx, sign-up/page.tsx, forgot-password/page.tsx, reset-password/page.tsx
    auth/callback/route.ts         OAuth and email-link code exchange
    auth/sign-out/route.ts         POST only
    api/stripe/webhook/route.ts    Stripe events (raw body, signature check)
    layout.tsx, error.tsx, not-found.tsx, loading.tsx
  components/
    ui/        Button, Input, Select, Badge, Skeleton, Toast, Dialog, Sheet (cart drawer), Pagination
    catalog/   ProductCard, ProductGrid, FilterBar, SortSelect, VariantPicker, ImageGallery, PriceTag
    cart/      CartLine, QuantityStepper, CartSummary, CartCountBadge
    checkout/  AddressForm, SavedAddressList, DeliveryOptions, OrderSummary, PayButton
    auth/      SignInForm, SignUpForm, GoogleButton, UserMenu
  features/                        One folder per domain; only server code touches Supabase
    catalog/   queries.ts (server-only), types.ts, search-params.ts (parse and validate PLP params)
    cart/      actions.ts ("use server"), queries.ts, pricing.ts (pure, shared with tests)
    checkout/  actions.ts, validation.ts (zod), totals.ts (pure display maths)
    orders/    queries.ts, status.ts (labels and colors per status)
    auth/      actions.ts, guest.ts (anonymous session and cart merge)
    payments/  stripe.ts (server-only client), webhook-handlers.ts
    email/     resend.ts, templates/OrderConfirmation.tsx
  lib/
    supabase/  server.ts, client.ts, middleware.ts, admin.ts (service role, server-only)
    env.ts     zod-validated environment
    money.ts   formatMoney, toMinorUnits
  middleware.ts                    Refreshes the Supabase session cookie on each request
  types/database.types.ts          `supabase gen types typescript`
```

Rules carried over from the course:

- Every module that reads Supabase or Stripe imports `"server-only"`.
- Pages and layouts are Server Components. Client Components are leaves: `VariantPicker`, `QuantityStepper`, `AddToCartButton`, `FilterBar`, forms.
- Client Components get plain serializable props (ids, names, prices, booleans), never clients or callbacks from the server.
- The browser never sends prices. Server Actions send ids and quantities; Postgres functions compute every total.
- `notFound()` for a missing product, category or order; `error.tsx` with a Retry button for real failures.

## 3. Data model

```
auth.users ──1:1── profiles
     │ 1:n
     ├── addresses            (accounts only)
     ├── carts ──1:n── cart_items ──n:1── product_variants ──n:1── products ──n:1── categories
     └── orders ──1:n── order_items (name, variant, sku, price snapshots)    products ──1:n── product_images
promotions, shipping_methods, store_settings (single row), payment_events (webhook idempotency)
```

Main points (all in the migration):

- `product_listings` view gives the PLP one row per sellable product with first image, min/max price, total stock and `in_stock`. It uses `security_invoker` so table RLS still applies. Full-text search is a generated `tsvector` column with a GIN index.
- One active cart per user (partial unique index), from Session 4.
- `orders` has a check constraint that allows only these combinations, so order and payment state can never disagree:

| Order `status` | `payment_status` | Meaning |
| --- | --- | --- |
| `pending` | `pending` | Waiting for Stripe. Stock is reserved. |
| `confirmed`, `processing`, `shipped`, `delivered` | `paid` | Paid; fulfilment moves forward from `confirmed`. |
| `canceled` | `canceled` | Shopper canceled, session expired, or replaced by a newer checkout (`cancel_reason` says which). Stock released. |
| `canceled` | `failed` | Payment was attempted and failed. Stock released. |
| `canceled` | `refunded` | Refunded after payment (admin, later). |

Database functions (exposed through `supabase.rpc`):

| Function | Who can call | What it does |
| --- | --- | --- |
| `mutate_cart(action, variant, qty)` | signed-in users and guests | add / update / remove / clear with stock checks. The only way to change a cart. |
| `create_checkout_order(shipping, saved_address, new_address, email, save_address)` | signed-in users and guests | Locks cart and variants, rechecks stock and prices, computes subtotal, delivery and tax, writes the order and item snapshots, reserves stock. One transaction. Replaces an earlier pending attempt for the same cart. |
| `cancel_my_pending_order(order)` | the order's owner | Cancel from the Stripe cancel page; releases stock. |
| `attach_checkout_session(order, session)` | service role | Stores the Stripe session id. |
| `mark_order_paid(order, session, intent, amount, currency)` | service role | Checks session and amount match, confirms the order, removes the purchased items from the cart. Safe to call twice. |
| `mark_order_unpaid(order, 'failed' or 'expired')` | service role | Cancels a pending order and releases stock. Safe to call twice. |
| `merge_guest_cart(guest, account)` | service role | Moves a guest's cart and orders into the account they signed in to. |

RLS: catalog tables are public read-only for active rows. Profiles, addresses, carts, cart items, orders and order items are visible only to their owner. Users can edit only `full_name`, `phone` and `avatar_url` on their profile (column grant), so nobody can make themselves `admin`. Orders, carts and stock have no write grants for browser roles at all. `payment_events` is service-role only.

## 4. Authentication, guests and accounts

Sign-in methods: email and password (with email confirmation through Resend SMTP) and Google OAuth, per Session 3. Password reset via Supabase's recovery email and `/reset-password`.

| | Guest | Account |
| --- | --- | --- |
| How they exist | `signInAnonymously()` the first time they add to cart. Browsing needs no session. | Sign up or sign in. |
| Cart | Database cart, same as accounts; survives refresh on that browser. | Database cart on every device. |
| Checkout | Enters email and address each time. | Email prefilled; choose a saved address or add one ("Save this address"). |
| After paying | Confirmation page and email with order number. Prompt: "Create an account to track this order" which converts the guest in place (`updateUser({ email, password })`), keeping cart and orders. | Order history at `/orders`. |
| Signing in mid-shop | Before sign-in the server reads the guest user id; after sign-in it calls `merge_guest_cart` with the service role, so the cart carries over. For Google, the guest id is put in a short-lived signed httpOnly cookie before the redirect and merged in `/auth/callback`. | |

Protected routes: `/orders`, `/account/*` need a non-guest user (checked in the page with `supabase.auth.getUser()`, redirect to `/sign-in?next=`). `/checkout` needs a non-empty cart, not an account.

Supabase settings needed: Anonymous sign-ins on, with CAPTCHA (Turnstile) or rate limits to stop abuse; Google provider; Site URL and redirect URLs for localhost and production; custom SMTP with Resend. A scheduled cleanup can delete anonymous users older than 30 days with no orders.

## 5. Catalog pages

- **Homepage**: hero carousel and banner from `promotions`, category tiles, featured products (`is_featured`), new arrivals. Cached with `revalidate = 300` and revalidated by tag when the catalog changes.
- **PLP** (`/category/[slug]`, `/products?q=`): reads `product_listings`. All state lives in the URL so it is shareable and back-button safe:
  - Filters: category, brand (multi), price range (`min_price`), in stock only.
  - Sort: featured, newest, price low to high, price high to low, name.
  - Pagination: 12 per page with `.range()` and `count: 'exact'`; numbered pages with previous and next links.
  - Search params are parsed with zod; bad values fall back to defaults rather than erroring.
  - Empty state ("No products match these filters", clear-filters button); skeleton grid in `loading.tsx`.
- **PDP** (`/products/[slug]`): gallery, name, brand, price with "was" price and discount badge, stock status per selected variant ("In stock", "Only 3 left", "Out of stock"), variant picker built from `options` keys (unavailable combinations disabled), quantity stepper capped at stock, Add to cart with pending state and toast, specs table, related products in a `Suspense` boundary. `generateMetadata` uses the same query. `generateStaticParams` for featured products; the rest render on demand.

Caching follows the Session 1 table: catalog cached and revalidated; cart, checkout and orders always dynamic and private.

## 6. Cart

- Server Actions in `features/cart/actions.ts` call `mutate_cart`, then `revalidatePath('/cart')`. Errors from the function (for example "Only 3 left in stock.") come back as messages shown next to the line.
- Header badge reads the cart count on the server; the add-to-cart button uses `useOptimistic` for instant feedback.
- `/cart`: lines with image, name, variant, unit price, stepper, remove; subtotal; "Delivery and tax calculated at checkout" with the free-delivery threshold progress ("Add $12.50 for free delivery"); empty state with links to categories.
- Lines whose variant went out of stock or inactive are flagged and block checkout until fixed.

## 7. Checkout and payment

```
/checkout (server page)            Server Action: startCheckout(form)           Stripe
-------------------------          ----------------------------------          ------
cart lines + saved addresses  ->   validate with zod
contact, address, delivery         expire any open Stripe session for this cart
order summary with subtotal,       rpc create_checkout_order(...)  -> order id
delivery, tax, total               stripe.checkout.sessions.create({
                                     line_items from order_items (+ delivery, tax lines),
                                     metadata.order_id, client_reference_id,
                                     customer_email, expires_at: now + 30 min,
                                     success_url: /checkout/confirmation?session_id={CHECKOUT_SESSION_ID},
                                     cancel_url:  /checkout/canceled?order=<id> })
                                   rpc attach_checkout_session      (service role)
                                   redirect(session.url)           ->  hosted payment page
```

Totals are shown on `/checkout` using the same rules as the database (the pure `totals.ts` is unit-tested against the same cases), but the amount charged is always the one `create_checkout_order` stored. Stripe line items use the order's stored unit prices plus separate "Delivery" and "Tax" lines, so the Stripe total equals `orders.total_amount` exactly; `mark_order_paid` rejects any mismatch.

Outcomes:

| Outcome | How we learn it | What happens | What the shopper sees |
| --- | --- | --- | --- |
| Success | Webhook `checkout.session.completed` with `payment_status = paid` (or `checkout.session.async_payment_succeeded`). The confirmation page also retrieves the session and calls the same function, so it does not wait on the webhook. | `mark_order_paid`: order `confirmed` / `paid`, purchased items removed from cart, confirmation email sent once (guarded by `payment_events`). | `/checkout/confirmation`: order number, items, address, delivery estimate, totals, what happens next, link to the order (or create-account prompt for guests). |
| Pending confirmation | Session complete but payment still processing | Order stays `pending`. | "We're confirming your payment" with automatic refresh. |
| Canceled | Shopper clicks back on Stripe (`cancel_url`) | Server expires the session, calls `cancel_my_pending_order`; stock released. Cart untouched. | `/checkout/canceled`: "Payment canceled, you have not been charged", Return to checkout. |
| Expired | Webhook `checkout.session.expired` | `mark_order_unpaid(order, 'expired')`. | Nothing; the cart is still there. |
| Failed | Webhook `checkout.session.async_payment_failed`. Card declines happen on the Stripe page, which lets the shopper retry there. | `mark_order_unpaid(order, 'failed')`; stock released. | Order page shows "Payment failed" with Try again (starts a fresh checkout from the same cart). |
| Problem after payment | `mark_order_paid` raises (order was already canceled, amount mismatch) | Webhook handler refunds the payment intent and logs it. | Email explaining the refund. |

Webhook handler (`app/api/stripe/webhook/route.ts`): reads the raw body, verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`, inserts the event id into `payment_events` (duplicate means already handled, return 200), dispatches by type, returns 200 quickly. Uses the service-role Supabase client, which lives only in `lib/supabase/admin.ts`.

## 8. UI and accessibility

- Tailwind with a small token set (colors, radius, spacing); shared `ui/` components with visible focus rings, 44px touch targets, labels on every input, `aria-live` for cart and form messages, and color contrast at WCAG AA.
- Mobile first: cart opens as a bottom sheet, filters in a slide-over, sticky Add to cart on PDP and sticky Pay button on checkout.
- Every data view has loading (skeletons), empty and error states. Forms show field errors inline and keep entered values on failure. Buttons show a pending state and are disabled while submitting to prevent double orders.
- `next/image` with `remotePatterns` for the image host; prices formatted with one `formatMoney` so server and client output match (no hydration mismatch).

## 9. Environment variables

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
STRIPE_SECRET_KEY=                  # server only
STRIPE_WEBHOOK_SECRET=              # server only
RESEND_API_KEY=                     # server only
EMAIL_FROM="Next Ecom <orders@yourdomain.com>"
GUEST_MERGE_COOKIE_SECRET=          # server only, signs the guest id cookie for OAuth merges
```

`lib/env.ts` validates these at startup with zod. Nothing secret uses the `NEXT_PUBLIC_` prefix.

## 10. Testing

- **Jest unit tests** (Session 5 style, `testEnvironment: node`): `pricing.ts` (subtotal, line totals), `totals.ts` (delivery threshold at 74.99 / 75.00, tax rounding, never negative), `isValidQuantity`, PLP search-param parsing, checkout zod schemas, order status labels, webhook dispatch with a mocked Supabase client.
- **Component tests** (React Testing Library, `jsdom`): ProductCard price and badge, VariantPicker disabling sold-out options, QuantityStepper limits, AddressForm validation messages.
- **SQL tests**: `supabase/tests/checkout_flow.test.sql` (already passing) covers stock reservation, superseded checkouts, cancel, merge, paid and failed outcomes and cross-user isolation. Run it in CI against a Postgres service container.
- **End-to-end** (Playwright, Stripe test mode): guest buys with card 4242 4242 4242 4242 and sees confirmation; canceled payment returns to an intact cart; signed-in checkout with a saved address.

## 11. Delivery milestones

1. **Foundation**: Next.js app, Tailwind, Supabase clients and middleware, env validation, migration and seed applied, generated types, layout with header and footer, CI running lint, typecheck and Jest.
2. **Catalog**: homepage, PLP with filters, sort and pagination, search, PDP with variants and gallery, loading, empty, error and not-found states.
3. **Auth**: sign-up, sign-in, Google, sign-out, password reset, account page and address book.
4. **Cart**: guest anonymous session, `mutate_cart` actions, cart page and drawer, header badge, merge on sign-in.
5. **Checkout and payment**: checkout page, `create_checkout_order`, Stripe Checkout, webhook, confirmation, canceled and failed views, order history and detail.
6. **Email and polish**: Resend order email, accessibility pass, mobile pass, Playwright suite, deploy to Vercel with production Supabase and Stripe webhook.

## 12. Setup checklist (when we create the real services)

1. Supabase project: run the migration and seed in the SQL editor (or `supabase db push` and `supabase db seed`). Turn on Anonymous sign-ins and CAPTCHA, Google provider, URL configuration, Resend SMTP.
2. Stripe account in test mode: secret key, a webhook endpoint for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Locally, `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Resend: API key and a verified sending domain.
4. GitHub repository and Vercel project.

## 13. Notes for later

- Discount codes: `orders.discount_amount` already exists; add a `discount_codes` table and apply it inside `create_checkout_order`.
- Admin catalog management: add an `is_admin()` helper reading `profiles.role` and write policies for catalog tables, or keep admin work in server code using the service role.
- Supabase's default privileges grant new public tables and functions to `anon` and `authenticated`; every future migration should revoke and grant explicitly like this one does.
