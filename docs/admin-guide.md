# Admin dashboard

The dashboard lives at **/admin** (on the live site: `https://tiny-threads-rho.vercel.app/admin`). Everything it shows and saves is read from and written to Supabase; you never need the Supabase Table Editor for day-to-day work.

## One-time setup

1. **Run the admin migration.** In Supabase, open **SQL Editor → New query**, paste all of [`supabase/migrations/20261107000000_admin.sql`](../supabase/migrations/20261107000000_admin.sql) and click **Run**. It is safe on a database that already has products and orders. It adds:
   - admin access rules (row level security) for the catalog, orders, customers and settings,
   - a public `product-images` storage bucket that only admins can upload to,
   - page and placement options for banners, so heroes, carousels and feature cards can go on any page.
2. **Make your account an admin.** Sign up / sign in on the store once with the account you want to use, then run this in the SQL editor (use your own email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   After that you can promote other people from **Admin → Customers**, so this SQL is only needed once.
3. **Pull and restart.** `git pull`, `npm install`, then restart `npm run dev`. Sign in and open the account menu: **Admin dashboard** now appears there. Vercel redeploys on its own when the PR is merged.

Nothing new is needed in `.env.local` or Vercel. Refunds use the Stripe key you already have.

## What you can do

| Section | What it does |
| --- | --- |
| **Overview** | Paid revenue for the last 7, 30 or 90 days with a per-day chart, orders waiting to be fulfilled, new customers, variants running low, latest orders. |
| **Orders** | Search by order number or email, filter by status. Open an order to move it through confirmed → processing → shipped → delivered, refund a paid order in Stripe (optionally putting the items back in stock), or cancel an unpaid one. |
| **Products** | Create, edit, hide or delete products. Each product has sizes / variants with their own SKU, price and stock, and any number of photos (upload, or paste an Unsplash link), reorderable; the first is the cover. |
| **Categories** | Create, edit, hide, reorder and delete (empty) categories, with a photo. |
| **Banners & content** | Announcement bars, hero banners and feature cards for the home page, all products page, category pages (one category or all of them), the cart, or every page. Two or more live hero banners on the same page play as a carousel. Each item can be scheduled with a start and end time, or kept as a draft. |
| **Customers** | Accounts with their order count and total spend. Make someone an admin or remove admin access (you can't remove your own). |
| **Settings** | Store name, sales tax, and delivery methods (price, free-over threshold, delivery days, on/off). |

Changes show on the storefront immediately.

## How access is protected

- Pages and actions under `/admin` check `profiles.role = 'admin'` on the server. Signed-out visitors are sent to sign in; signed-in customers get a 404.
- The database checks again: row level security policies and the `admin_*` functions all call `public.is_admin()`, so a customer's session can't read other people's orders or change the catalog even by calling Supabase directly.
- Order state still only moves through database functions, so the paid / canceled / refunded rules from checkout keep holding.
- Photo uploads go to the `product-images` bucket with the admin's own session; Storage refuses uploads from anyone else. Images are limited to JPG, PNG, WebP or AVIF up to 4 MB, and pasted links must come from Unsplash or your Supabase storage (the hosts the storefront is configured to display).
