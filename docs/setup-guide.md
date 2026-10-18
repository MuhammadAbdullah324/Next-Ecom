# Setup guide: Supabase, Stripe and GitHub

You only need sections 1 to 3 to run the store locally. Sections 4 and 5 (Google sign-in and Resend email) can wait.

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Name it `next-ecom`, set a strong database password (save it in a password manager) and pick the region closest to your customers. Click **Create new project** and wait a minute or two for it to finish.

## 2. Create the tables and sample products

1. In the project, open **SQL Editor** and click **New query**.
2. Open [`supabase/migrations/20261018000000_init.sql`](supabase/migrations/20261018000000_init.sql), copy all of it, paste it into the editor and click **Run**. You should see "Success. No rows returned".
3. Click **New query** again. Do the same with [`supabase/seed.sql`](supabase/seed.sql).
   If you already ran an older seed with the phone accessories catalog, run [`supabase/replace-catalog.sql`](supabase/replace-catalog.sql) first, then `seed.sql`. It removes only products, categories and banners; accounts and orders stay.
4. Check: open **Table Editor** and pick `products`. It should list 21 products.

## 3. Turn on sign-in and guest checkout

1. **Authentication → Sign In / Providers**
   - **Email**: on. **Confirm email**: on.
   - **Allow anonymous sign-ins**: on. Guests need this to have a cart.
2. **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/**`. When the site goes live, add `https://your-domain.com/**` too.
3. **Project Settings → API Keys**. You will need three values:
   - **Project URL**, for example `https://abcd1234.supabase.co`
   - **Publishable key** (`sb_publishable_...`)
   - **Secret key** (`sb_secret_...`)

The Project URL and publishable key are public, so you can paste them in our chat. **Never paste the secret key in chat.** It goes in the `.env.local` file on your computer and in your hosting settings, and nowhere else.

## 4. Stripe (test mode)

1. Create an account at <https://dashboard.stripe.com/register>. Stay in **Test mode** (toggle at the top right).
2. **Developers → API keys**: copy the **Secret key** (`sk_test_...`). It goes in `.env.local` only.
3. Install the Stripe CLI (<https://docs.stripe.com/stripe-cli>), then run `stripe login`. When the app is running, `npm run stripe:listen` prints a webhook secret (`whsec_...`) for `.env.local`.
4. Test card: `4242 4242 4242 4242`, any future expiry date, any CVC.

## 5. Later: Google sign-in and email (Resend)

- **Google**: follow Session 3 slides 6–12. Create an OAuth client in Google Cloud. The redirect URI is `https://<your-project>.supabase.co/auth/v1/callback`. Paste the client ID and secret under **Authentication → Sign In / Providers → Google**.
- **Resend**: create an API key with sending access and verify a domain. In Supabase, open **Authentication → Emails → SMTP Settings** and enter host `smtp.resend.com`, port `465`, username `resend`, password = API key. Put the same key in `.env.local` as `RESEND_API_KEY` for order emails.

Until Resend is set up, Supabase's built-in email sender only allows a few emails per hour. That is fine for testing.

## 6. GitHub

1. Connect your GitHub account to Claude at <https://claude.ai/connect-github>. Install the Claude GitHub App when asked, and give it access to the new repository (or to all repositories).
2. On GitHub, click **New repository** and name it `next-ecom`. It can be private. Leave it empty: no README, no .gitignore, no license.
3. Send me the name as `your-username/next-ecom`.

## 7. Run it on your computer

When the code is in the repo:

```sh
git clone https://github.com/<you>/next-ecom.git
cd next-ecom
npm install
cp .env.example .env.local   # then fill in the values from steps 3 and 4
npm run dev                  # open http://localhost:3000
```
