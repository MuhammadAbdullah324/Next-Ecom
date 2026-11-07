-- Tiny Threads: admin dashboard
-- Lets accounts with profiles.role = 'admin' manage the catalog, orders, customers and settings
-- from /admin. Run after 20261018000000_init.sql (SQL editor, or `supabase db push`).
--
-- Make yourself an admin afterwards (replace the email):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- Every admin write is checked twice: the Next.js server refuses non-admins, and RLS / the
-- functions below refuse them again in the database.

-- ---------------------------------------------------------------------------
-- Who is an admin
-- ---------------------------------------------------------------------------

-- security definer so policies on profiles can call it without recursing into profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not public.is_guest_user()
     and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only store admins can do that.' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog and settings: admins can read everything (including hidden rows) and write
-- ---------------------------------------------------------------------------

create policy "Admins manage categories" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage products" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage product images" on public.product_images
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage product variants" on public.product_variants
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage promotions" on public.promotions
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage shipping methods" on public.shipping_methods
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins update store settings" on public.store_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant insert, update, delete on public.categories, public.products, public.product_images,
  public.product_variants, public.promotions, public.shipping_methods to authenticated;
grant update (store_name, tax_rate) on public.store_settings to authenticated;

-- ---------------------------------------------------------------------------
-- People and orders: admins read all; orders change only through the functions below
-- ---------------------------------------------------------------------------

create policy "Admins can view all profiles" on public.profiles
  for select to authenticated using ((select public.is_admin()));

create policy "Admins can view all orders" on public.orders
  for select to authenticated using ((select public.is_admin()));

create policy "Admins can view all order items" on public.order_items
  for select to authenticated using ((select public.is_admin()));

create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status, created_at desc);

-- Fulfillment steps for a paid order. Admins may also step back to correct a mistake.
create or replace function public.admin_set_order_status(target_order uuid, new_status text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
begin
  perform private.require_admin();

  if new_status is null or new_status not in ('confirmed', 'processing', 'shipped', 'delivered') then
    raise exception 'Choose confirmed, processing, shipped or delivered.' using errcode = '22023';
  end if;

  select * into o from public.orders where id = target_order for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if o.payment_status <> 'paid' then
    raise exception 'Only paid orders can be fulfilled. This order is %.', o.status using errcode = 'P0001';
  end if;

  update public.orders set status = new_status where id = o.id;
  return new_status;
end;
$$;

-- Cancels an order from the dashboard.
--   pending order: releases its reserved stock (the server expires the Stripe page first).
--   paid order:    call only after the server refunded the payment in Stripe; records the refund
--                  and puts the items back in stock when restock is true.
create or replace function public.admin_cancel_order(target_order uuid, restock boolean default true)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
begin
  perform private.require_admin();

  select * into o from public.orders where id = target_order for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if o.status = 'canceled' then
    return o.payment_status;
  end if;

  if o.status = 'pending' then
    return private.cancel_order(o.id, 'canceled', 'admin');
  end if;

  -- Paid: the refund already happened in Stripe.
  if restock then
    update public.product_variants v
    set stock_quantity = v.stock_quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = o.id and v.id = oi.variant_id;
  end if;

  update public.orders
  set status = 'canceled', payment_status = 'refunded', cancel_reason = 'admin', canceled_at = now()
  where id = o.id;

  return 'refunded';
end;
$$;

-- Promote or demote an account. Admins cannot demote themselves, so the store always keeps one.
create or replace function public.admin_set_role(target_user uuid, new_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();

  if new_role is null or new_role not in ('customer', 'admin') then
    raise exception 'Unknown role.' using errcode = '22023';
  end if;
  if target_user = auth.uid() and new_role <> 'admin' then
    raise exception 'You cannot remove your own admin access.' using errcode = 'P0001';
  end if;
  if new_role = 'admin' and exists (select 1 from auth.users where id = target_user and is_anonymous) then
    raise exception 'Guest shoppers cannot be admins.' using errcode = 'P0001';
  end if;

  update public.profiles set role = new_role where id = target_user;
  if not found then
    raise exception 'Customer not found.' using errcode = 'P0002';
  end if;
  return new_role;
end;
$$;

-- Numbers for the dashboard overview, computed in one round trip.
-- Revenue counts paid orders that were not refunded, by the day they were paid (UTC).
create or replace function public.admin_dashboard_stats(days integer default 30, low_stock integer default 5)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  since timestamptz;
  result jsonb;
begin
  perform private.require_admin();
  days := least(greatest(coalesce(days, 30), 1), 365);
  since := date_trunc('day', now() at time zone 'utc') at time zone 'utc' - make_interval(days => days - 1);

  select jsonb_build_object(
    'days', days,
    'revenue', coalesce((select sum(total_amount) from public.orders
                         where payment_status = 'paid' and paid_at >= since), 0),
    'paid_orders', (select count(*) from public.orders where payment_status = 'paid' and paid_at >= since),
    'to_fulfill', (select count(*) from public.orders where status in ('confirmed', 'processing')),
    'awaiting_payment', (select count(*) from public.orders where status = 'pending'),
    'customers', (select count(*) from public.profiles p join auth.users u on u.id = p.id where not u.is_anonymous),
    'new_customers', (select count(*) from public.profiles p join auth.users u on u.id = p.id
                      where not u.is_anonymous and p.created_at >= since),
    'active_products', (select count(*) from public.products where is_active),
    'low_stock', (select count(*) from public.product_variants v join public.products p on p.id = v.product_id
                  where v.is_active and p.is_active and v.stock_quantity <= low_stock),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'revenue', coalesce(r.revenue, 0), 'orders', coalesce(r.orders, 0))
                                order by d.day), '[]'::jsonb)
      from generate_series(since, since + make_interval(days => days - 1), interval '1 day') as d(day)
      left join (
        select date_trunc('day', paid_at at time zone 'utc') at time zone 'utc' as day,
               sum(total_amount) as revenue, count(*) as orders
        from public.orders
        where payment_status = 'paid' and paid_at >= since
        group by 1
      ) r on r.day = d.day
    )
  ) into result;

  return result;
end;
$$;

-- Order count and spend per customer, for the customers page.
create or replace function public.admin_customer_totals(user_ids uuid[])
returns table (user_id uuid, orders bigint, spent numeric, last_order_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return query
    select o.user_id, count(*), coalesce(sum(o.total_amount) filter (where o.payment_status = 'paid'), 0), max(o.created_at)
    from public.orders o
    where o.user_id = any(user_ids) and o.status <> 'pending'
    group by o.user_id;
end;
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function private.require_admin() from public, anon, authenticated;
revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
revoke all on function public.admin_cancel_order(uuid, boolean) from public, anon;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
revoke all on function public.admin_dashboard_stats(integer, integer) from public, anon;
revoke all on function public.admin_customer_totals(uuid[]) from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;
grant execute on function public.admin_cancel_order(uuid, boolean) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_dashboard_stats(integer, integer) to authenticated;
grant execute on function public.admin_customer_totals(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Product photo uploads: a public Storage bucket that only admins can write to
-- ---------------------------------------------------------------------------

do $storage$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'No storage schema (plain Postgres test run); skipping the product-images bucket.';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('product-images', 'product-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  drop policy if exists "Admins list product images" on storage.objects;
  drop policy if exists "Admins upload product images" on storage.objects;
  drop policy if exists "Admins update product images" on storage.objects;
  drop policy if exists "Admins delete product images" on storage.objects;

  -- The Storage API reads the row before it overwrites or deletes a file.
  create policy "Admins list product images" on storage.objects
    for select to authenticated
    using (bucket_id = 'product-images' and (select public.is_admin()));
  create policy "Admins upload product images" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'product-images' and (select public.is_admin()));
  create policy "Admins update product images" on storage.objects
    for update to authenticated
    using (bucket_id = 'product-images' and (select public.is_admin()));
  create policy "Admins delete product images" on storage.objects
    for delete to authenticated
    using (bucket_id = 'product-images' and (select public.is_admin()));
end;
$storage$;

-- ---------------------------------------------------------------------------
-- Page content: announcement bars, hero banners (several heroes on a page become a carousel)
-- and feature cards, placed on chosen storefront pages from /admin/content
-- ---------------------------------------------------------------------------

alter table public.promotions drop constraint if exists promotions_placement_check;
alter table public.promotions
  add column if not exists page text not null default 'home',
  add column if not exists category_id uuid references public.categories(id) on delete cascade,
  add column if not exists eyebrow text,
  add column if not exists cta2_label text,
  add column if not exists cta2_href text;

-- The original home page showed the first hero as the big banner and the rest as feature cards.
-- Keep that look: every hero after the first becomes a feature card.
update public.promotions p
set placement = 'feature'
where p.placement = 'hero'
  and exists (
    select 1 from public.promotions q
    where q.placement = 'hero' and q.id <> p.id
      and (q.sort_order, q.created_at, q.id) < (p.sort_order, p.created_at, p.id)
  );

-- The labels and second button the home page used to hard-code.
update public.promotions set eyebrow = 'New season', cta2_label = 'Shop baby', cta2_href = '/category/baby'
where placement = 'hero' and eyebrow is null and cta2_label is null;
update public.promotions set eyebrow = 'Limited time' where placement = 'feature' and eyebrow is null;

alter table public.promotions
  add constraint promotions_placement_check check (placement in ('banner', 'hero', 'feature')),
  add constraint promotions_page_check check (page in ('all', 'home', 'products', 'category', 'cart')),
  add constraint promotions_all_pages_banner_only check (page <> 'all' or placement = 'banner'),
  add constraint promotions_category_page_only check (category_id is null or page = 'category'),
  add constraint promotions_cta2_internal check (cta2_href is null or cta2_href ~ '^/');

create index if not exists promotions_page_idx on public.promotions(page, placement, sort_order);
create index if not exists promotions_category_id_idx on public.promotions(category_id);
