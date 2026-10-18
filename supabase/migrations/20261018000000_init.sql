-- Next Ecom: initial schema
-- Catalog, profiles, addresses, carts, orders, payments.
-- Run in the Supabase SQL editor, or keep it in supabase/migrations and run `supabase db push`.
--
-- Conventions
--   * Money is numeric(10,2) in the store currency (store_settings.currency). Stripe gets minor units.
--   * Guests shop as Supabase anonymous users, so every cart and order has an auth.users owner
--     and the same RLS covers guests and accounts. See plan/implementation-plan.md.
--   * The browser never writes carts, orders or stock directly. It calls mutate_cart() and
--     create_checkout_order(). Payment outcomes are written by the server with the service role.

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True when the caller signed in with supabase.auth.signInAnonymously() (a guest).
create or replace function public.is_guest_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- ---------------------------------------------------------------------------
-- Store configuration
-- ---------------------------------------------------------------------------

create table public.store_settings (
  id boolean primary key default true check (id), -- single row
  store_name text not null default 'Next Ecom',
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  tax_rate numeric(5, 4) not null default 0 check (tax_rate >= 0 and tax_rate < 1),
  updated_at timestamptz not null default now()
);

create table public.shipping_methods (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  free_over numeric(10, 2) check (free_over is null or free_over > 0),
  min_days integer not null check (min_days >= 0),
  max_days integer not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  check (max_days >= min_days)
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text,
  short_description text,
  description text,
  -- Base price. A variant may override it.
  price numeric(10, 2) not null check (price >= 0),
  -- "Was" price for the discount badge.
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price > price),
  specs jsonb not null default '{}'::jsonb check (jsonb_typeof(specs) = 'object'),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(short_description, '') || ' ' || coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Every product has at least one variant; stock lives here.
-- options holds the PDP selectors, e.g. {"Color": "Black", "Length": "2 m"}. A product with no
-- choices has one variant with options = {}.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  options jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object'),
  price numeric(10, 2) check (price is null or price >= 0), -- null = product price
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index product_variants_one_default_idx
  on public.product_variants(product_id) where is_default;

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('hero', 'banner')),
  title text not null,
  subtitle text,
  cta_label text,
  cta_href text check (cta_href is null or cta_href ~ '^/'), -- internal links only
  image_url text,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- PLP read model: one row per sellable product, with the first image, price range and stock.
-- security_invoker keeps the underlying tables' RLS in force.
create view public.product_listings
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.name,
  p.brand,
  p.short_description,
  p.price,
  p.compare_at_price,
  p.is_featured,
  p.created_at,
  p.search,
  c.id as category_id,
  c.slug as category_slug,
  c.name as category_name,
  img.url as image_url,
  img.alt_text as image_alt,
  v.min_price,
  v.max_price,
  v.total_stock,
  v.total_stock > 0 as in_stock,
  v.variant_count
from public.products p
join public.categories c on c.id = p.category_id and c.is_active
left join lateral (
  select i.url, i.alt_text
  from public.product_images i
  where i.product_id = p.id
  order by i.sort_order, i.created_at
  limit 1
) img on true
join lateral (
  select
    min(coalesce(pv.price, p.price)) as min_price,
    max(coalesce(pv.price, p.price)) as max_price,
    coalesce(sum(pv.stock_quantity), 0)::integer as total_stock,
    count(*)::integer as variant_count
  from public.product_variants pv
  where pv.product_id = p.id and pv.is_active
) v on true
where p.is_active and v.variant_count > 0;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- A guest who converts to an account (updateUser({ email })) keeps the same id; copy the email.
create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text, -- Home, Office...
  full_name text not null check (length(trim(full_name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  address_line_1 text not null check (length(trim(address_line_1)) > 0),
  address_line_2 text,
  city text not null check (length(trim(city)) > 0),
  state text,
  postal_code text not null check (length(trim(postal_code)) > 0),
  country text not null default 'Pakistan',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index addresses_one_default_per_user_idx
  on public.addresses(user_id) where is_default;

-- Setting a new default clears the old one.
create or replace function private.addresses_single_default()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false
    where user_id = new.user_id and is_default and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger addresses_single_default
  before insert or update of is_default on public.addresses
  for each row execute function private.addresses_single_default();

-- ---------------------------------------------------------------------------
-- Cart
-- ---------------------------------------------------------------------------

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'checked_out', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index carts_one_active_cart_per_user_idx
  on public.carts(user_id) where status = 'active';

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

-- ---------------------------------------------------------------------------
-- Orders and payments
-- ---------------------------------------------------------------------------

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('NE-' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  -- set null so deleting a stale guest user keeps the order record
  user_id uuid references auth.users(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  is_guest boolean not null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
  cancel_reason text
    check (cancel_reason in ('customer_canceled', 'payment_failed', 'expired', 'superseded', 'admin')),
  shipping_method_code text references public.shipping_methods(code),
  shipping_method_name text not null,
  address_id uuid references public.addresses(id) on delete set null,
  shipping_address jsonb not null, -- snapshot; saved addresses can change later
  currency text not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_amount numeric(10, 2) not null default 0 check (shipping_amount >= 0),
  tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0),
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  paid_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_amount = subtotal + shipping_amount + tax_amount - discount_amount),
  -- The only legal combinations of order and payment state.
  constraint orders_status_consistent check (
    (status = 'pending' and payment_status = 'pending' and cancel_reason is null)
    or (status in ('confirmed', 'processing', 'shipped', 'delivered') and payment_status = 'paid' and paid_at is not null)
    or (status = 'canceled' and payment_status in ('failed', 'canceled', 'refunded') and canceled_at is not null)
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  -- snapshots: catalog names and prices can change after purchase
  product_name text not null,
  variant_name text not null,
  sku text not null,
  image_url text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  check (line_total = unit_price * quantity)
);

-- Stripe webhook deliveries already processed (idempotency). Server-only.
create table public.payment_events (
  id text primary key, -- Stripe event id (evt_...)
  type text not null,
  order_id uuid references public.orders(id) on delete set null,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger set_updated_at before update on public.store_settings for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.products for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.product_variants for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.addresses for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.carts for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.cart_items for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.orders for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes (foreign keys, RLS filters, PLP filters and sorts)
-- ---------------------------------------------------------------------------

create index products_category_id_idx on public.products(category_id);
create index products_active_created_idx on public.products(created_at desc) where is_active;
create index products_featured_idx on public.products(category_id) where is_featured and is_active;
create index products_search_idx on public.products using gin(search);
create index product_images_product_id_idx on public.product_images(product_id, sort_order);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index addresses_user_id_idx on public.addresses(user_id);
create index carts_user_id_idx on public.carts(user_id);
create index cart_items_cart_id_idx on public.cart_items(cart_id);
create index cart_items_variant_id_idx on public.cart_items(variant_id);
create index orders_user_id_created_idx on public.orders(user_id, created_at desc);
create index orders_cart_id_idx on public.orders(cart_id) where status = 'pending';
create index order_items_order_id_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------------
-- Cart mutations (called from Server Actions via supabase.rpc)
-- ---------------------------------------------------------------------------

-- mutate_cart('add' | 'update' | 'remove' | 'clear', variant_id, quantity) -> active cart id
-- add: increase by amount; update: set to amount; remove: delete the line; clear: empty the cart.
create or replace function public.mutate_cart(
  action text,
  target_variant uuid default null,
  amount integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  active_id uuid;
  available integer;
  current_quantity integer;
  next_quantity integer;
begin
  if uid is null then
    raise exception 'Please sign in to use your cart.' using errcode = '28000';
  end if;

  if action is null or action not in ('add', 'update', 'remove', 'clear') then
    raise exception 'Invalid cart action.' using errcode = '22023';
  end if;

  if action in ('add', 'update', 'remove') and target_variant is null then
    raise exception 'A product is required for this action.' using errcode = '22023';
  end if;

  if action in ('add', 'update') and (amount is null or amount < 1) then
    raise exception 'Quantity must be a positive whole number.' using errcode = '22023';
  end if;

  insert into public.carts (user_id, status)
  values (uid, 'active')
  on conflict (user_id) where status = 'active' do nothing;

  select id into active_id
  from public.carts
  where user_id = uid and status = 'active'
  for update;

  if action = 'clear' then
    delete from public.cart_items where cart_id = active_id;
  elsif action = 'remove' then
    delete from public.cart_items where cart_id = active_id and variant_id = target_variant;
  else
    select v.stock_quantity into available
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = target_variant and v.is_active and p.is_active;

    if not found then
      raise exception 'This product is no longer available.' using errcode = 'P0002';
    end if;

    select quantity into current_quantity
    from public.cart_items
    where cart_id = active_id and variant_id = target_variant;

    if action = 'update' and current_quantity is null then
      raise exception 'This item is no longer in your cart.' using errcode = 'P0002';
    end if;

    next_quantity := case when action = 'add' then coalesce(current_quantity, 0) + amount else amount end;

    if next_quantity > available then
      raise exception 'Only % left in stock.', available using errcode = 'P0001', hint = 'stock';
    end if;

    insert into public.cart_items (cart_id, variant_id, quantity)
    values (active_id, target_variant, next_quantity)
    on conflict (cart_id, variant_id) do update set quantity = excluded.quantity;
  end if;

  update public.carts set updated_at = now() where id = active_id;
  return active_id;
end;
$$;

-- Move a guest's cart (and any guest orders) into the account they just signed in to.
-- Called by the server with the service role right after sign-in, with the guest id it read
-- from the guest session before signing in.
create or replace function public.merge_guest_cart(from_user uuid, to_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  from_cart uuid;
  to_cart uuid;
begin
  if from_user is null or to_user is null or from_user = to_user then
    return null;
  end if;

  if not exists (select 1 from auth.users where id = from_user and is_anonymous) then
    raise exception 'Only a guest cart can be merged.' using errcode = '42501';
  end if;

  select id into from_cart from public.carts where user_id = from_user and status = 'active' for update;

  if from_cart is not null then
    insert into public.carts (user_id, status)
    values (to_user, 'active')
    on conflict (user_id) where status = 'active' do nothing;

    select id into to_cart from public.carts where user_id = to_user and status = 'active' for update;

    -- Sum quantities, capped at current stock.
    insert into public.cart_items (cart_id, variant_id, quantity)
    select to_cart, gi.variant_id, least(gi.quantity, v.stock_quantity)
    from public.cart_items gi
    join public.product_variants v on v.id = gi.variant_id and v.is_active and v.stock_quantity > 0
    where gi.cart_id = from_cart
    on conflict (cart_id, variant_id) do update
      set quantity = least(
        public.cart_items.quantity + excluded.quantity,
        (select stock_quantity from public.product_variants where id = excluded.variant_id)
      );

    -- Pending guest orders for the old cart are dropped (their stock comes back).
    perform private.cancel_order(o.id, 'canceled', 'superseded')
    from public.orders o
    where o.cart_id = from_cart and o.status = 'pending';

    update public.carts set status = 'abandoned' where id = from_cart;
  end if;

  update public.orders set user_id = to_user where user_id = from_user;

  return to_cart;
end;
$$;

-- ---------------------------------------------------------------------------
-- Checkout
-- ---------------------------------------------------------------------------

-- Puts reserved stock back and moves a pending order to canceled. Returns the resulting state.
create or replace function private.cancel_order(
  target_order uuid,
  outcome text,  -- payment_status to record: 'failed' or 'canceled'
  reason text    -- cancel_reason
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
begin
  if outcome not in ('failed', 'canceled') then
    raise exception 'Invalid payment outcome %.', outcome using errcode = '22023';
  end if;

  select * into o from public.orders where id = target_order for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if o.status <> 'pending' then
    return o.payment_status; -- already settled; nothing to do
  end if;

  update public.product_variants v
  set stock_quantity = v.stock_quantity + oi.quantity
  from public.order_items oi
  where oi.order_id = o.id and v.id = oi.variant_id;

  update public.orders
  set status = 'canceled', payment_status = outcome, cancel_reason = reason, canceled_at = now()
  where id = o.id;

  return outcome;
end;
$$;

-- Turns the caller's active cart into a pending order and reserves stock, all in one transaction.
-- Prices, shipping and tax are computed here from the database; the browser only sends choices.
--   shipping_method: shipping_methods.code
--   saved_address:   addresses.id (accounts only), or
--   new_address:     {"full_name","phone","address_line_1","address_line_2","city","state","postal_code","country"}
--   contact_email:   required for guests; accounts default to their sign-in email
-- Returns the new order id. The server then creates the Stripe Checkout Session for it.
create or replace function public.create_checkout_order(
  shipping_method text,
  saved_address uuid default null,
  new_address jsonb default null,
  contact_email text default null,
  save_address boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  guest boolean := public.is_guest_user();
  cart_row public.carts;
  ship public.shipping_methods;
  settings public.store_settings;
  addr jsonb;
  addr_id uuid;
  email text;
  short_item record;
  sub numeric(10, 2);
  ship_amount numeric(10, 2);
  tax numeric(10, 2);
  new_order uuid;
begin
  if uid is null then
    raise exception 'Your session has ended. Please refresh and try again.' using errcode = '28000';
  end if;

  select * into cart_row from public.carts where user_id = uid and status = 'active' for update;
  if not found or not exists (select 1 from public.cart_items where cart_id = cart_row.id) then
    raise exception 'Your cart is empty.' using errcode = 'P0001', hint = 'cart_empty';
  end if;

  -- One pending order per cart: starting checkout again replaces the earlier attempt.
  -- The server expires that attempt's Stripe session before calling this function.
  perform private.cancel_order(o.id, 'canceled', 'superseded')
  from public.orders o
  where o.cart_id = cart_row.id and o.status = 'pending';

  -- Contact email
  if guest then
    email := lower(trim(contact_email));
  else
    select coalesce(nullif(lower(trim(contact_email)), ''), u.email) into email
    from auth.users u where u.id = uid;
  end if;
  if email is null or email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address.' using errcode = '22023', hint = 'email';
  end if;

  -- Delivery address
  if saved_address is not null then
    if guest then
      raise exception 'Guests cannot use saved addresses.' using errcode = '42501';
    end if;
    select a.id,
           jsonb_build_object(
             'full_name', a.full_name, 'phone', a.phone,
             'address_line_1', a.address_line_1, 'address_line_2', a.address_line_2,
             'city', a.city, 'state', a.state, 'postal_code', a.postal_code, 'country', a.country)
      into addr_id, addr
    from public.addresses a
    where a.id = saved_address and a.user_id = uid;
    if not found then
      raise exception 'That address was not found.' using errcode = 'P0002', hint = 'address';
    end if;
  else
    if new_address is null or jsonb_typeof(new_address) <> 'object'
       or exists (
         select 1 from unnest(array['full_name', 'phone', 'address_line_1', 'city', 'postal_code', 'country']) k
         where coalesce(trim(new_address ->> k), '') = ''
       ) then
      raise exception 'Please complete the delivery address.' using errcode = '22023', hint = 'address';
    end if;
    addr := jsonb_build_object(
      'full_name', trim(new_address ->> 'full_name'), 'phone', trim(new_address ->> 'phone'),
      'address_line_1', trim(new_address ->> 'address_line_1'),
      'address_line_2', nullif(trim(new_address ->> 'address_line_2'), ''),
      'city', trim(new_address ->> 'city'), 'state', nullif(trim(new_address ->> 'state'), ''),
      'postal_code', trim(new_address ->> 'postal_code'), 'country', trim(new_address ->> 'country'));

    if save_address and not guest then
      insert into public.addresses (user_id, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country,
                                    is_default)
      values (uid, addr ->> 'full_name', addr ->> 'phone', addr ->> 'address_line_1', addr ->> 'address_line_2',
              addr ->> 'city', addr ->> 'state', addr ->> 'postal_code', addr ->> 'country',
              not exists (select 1 from public.addresses where user_id = uid))
      returning id into addr_id;
    end if;
  end if;

  select * into ship from public.shipping_methods where code = shipping_method and is_active;
  if not found then
    raise exception 'Choose a delivery method.' using errcode = '22023', hint = 'shipping';
  end if;

  select * into settings from public.store_settings where id;

  -- Lock the variants and check every line against live stock and availability.
  perform 1
  from public.product_variants v
  join public.cart_items ci on ci.variant_id = v.id and ci.cart_id = cart_row.id
  for update of v;

  select p.name as product_name, v.name as variant_name, v.stock_quantity, v.is_active and p.is_active as sellable
    into short_item
  from public.cart_items ci
  join public.product_variants v on v.id = ci.variant_id
  join public.products p on p.id = v.product_id
  where ci.cart_id = cart_row.id
    and (not (v.is_active and p.is_active) or v.stock_quantity < ci.quantity)
  limit 1;

  if found then
    if not short_item.sellable then
      raise exception '% is no longer available. Remove it to continue.', short_item.product_name
        using errcode = 'P0001', hint = 'stock';
    end if;
    raise exception 'Only % left of % (%). Update your cart to continue.',
      short_item.stock_quantity, short_item.product_name, short_item.variant_name
      using errcode = 'P0001', hint = 'stock';
  end if;

  select coalesce(sum(coalesce(v.price, p.price) * ci.quantity), 0) into sub
  from public.cart_items ci
  join public.product_variants v on v.id = ci.variant_id
  join public.products p on p.id = v.product_id
  where ci.cart_id = cart_row.id;

  ship_amount := case when ship.free_over is not null and sub >= ship.free_over then 0 else ship.price end;
  tax := round(sub * settings.tax_rate, 2);

  insert into public.orders (
    user_id, cart_id, is_guest, email, shipping_method_code, shipping_method_name,
    address_id, shipping_address, currency, subtotal, shipping_amount, tax_amount, discount_amount, total_amount)
  values (
    uid, cart_row.id, guest, email, ship.code, ship.name,
    addr_id, addr, settings.currency, sub, ship_amount, tax, 0, sub + ship_amount + tax)
  returning id into new_order;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, variant_name, sku, image_url, unit_price, quantity, line_total)
  select
    new_order, p.id, v.id, p.name, v.name, v.sku,
    (select i.url from public.product_images i where i.product_id = p.id order by i.sort_order, i.created_at limit 1),
    coalesce(v.price, p.price), ci.quantity, coalesce(v.price, p.price) * ci.quantity
  from public.cart_items ci
  join public.product_variants v on v.id = ci.variant_id
  join public.products p on p.id = v.product_id
  where ci.cart_id = cart_row.id;

  -- Reserve stock until the payment succeeds, fails or is canceled.
  update public.product_variants v
  set stock_quantity = v.stock_quantity - ci.quantity
  from public.cart_items ci
  where ci.cart_id = cart_row.id and v.id = ci.variant_id;

  return new_order;
end;
$$;

-- Server (service role) records the Stripe Checkout Session created for a pending order.
create or replace function public.attach_checkout_session(target_order uuid, session_id text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders
  set stripe_checkout_session_id = session_id
  where id = target_order and status = 'pending';
$$;

-- Payment succeeded (webhook checkout.session.completed / async_payment_succeeded, or the
-- confirmation page after retrieving the session). Idempotent.
-- Returns 'paid' or 'already_paid'. Raises if the order is no longer payable or the amount differs,
-- in which case the server refunds the payment.
create or replace function public.mark_order_paid(
  target_order uuid,
  session_id text,
  payment_intent text,
  amount_minor bigint,
  paid_currency text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
begin
  select * into o from public.orders where id = target_order for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if o.payment_status = 'paid' then
    return 'already_paid';
  end if;

  if o.status <> 'pending' then
    raise exception 'Order % is % and cannot be paid.', o.order_number, o.status
      using errcode = 'P0001', hint = 'not_payable';
  end if;

  if o.stripe_checkout_session_id is not null and o.stripe_checkout_session_id <> session_id then
    raise exception 'Checkout session does not match order %.', o.order_number using errcode = 'P0001', hint = 'session_mismatch';
  end if;

  if amount_minor <> round(o.total_amount * 100)::bigint or lower(paid_currency) <> o.currency then
    raise exception 'Paid amount does not match order %.', o.order_number using errcode = 'P0001', hint = 'amount_mismatch';
  end if;

  update public.orders
  set status = 'confirmed', payment_status = 'paid', paid_at = now(),
      stripe_checkout_session_id = session_id, stripe_payment_intent_id = payment_intent
  where id = o.id;

  -- Take the purchased quantities out of the cart. Anything added after checkout started stays.
  if o.cart_id is not null then
    delete from public.cart_items ci
    using public.order_items oi
    where oi.order_id = o.id and ci.cart_id = o.cart_id and ci.variant_id = oi.variant_id
      and ci.quantity <= oi.quantity;

    update public.cart_items ci
    set quantity = ci.quantity - oi.quantity
    from public.order_items oi
    where oi.order_id = o.id and ci.cart_id = o.cart_id and ci.variant_id = oi.variant_id;

    update public.carts c
    set status = 'checked_out'
    where c.id = o.cart_id and c.status = 'active'
      and not exists (select 1 from public.cart_items where cart_id = c.id);
  end if;

  return 'paid';
end;
$$;

-- Payment did not happen (webhook async_payment_failed or checkout.session.expired). Idempotent.
--   outcome 'failed'   -> payment_status failed,   cancel_reason payment_failed
--   outcome 'expired'  -> payment_status canceled, cancel_reason expired
create or replace function public.mark_order_unpaid(target_order uuid, outcome text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if outcome = 'failed' then
    return private.cancel_order(target_order, 'failed', 'payment_failed');
  elsif outcome = 'expired' then
    return private.cancel_order(target_order, 'canceled', 'expired');
  end if;
  raise exception 'Invalid outcome %.', outcome using errcode = '22023';
end;
$$;

-- The shopper canceled on the Stripe page (cancel_url). The server expires the Stripe session first.
create or replace function public.cancel_my_pending_order(target_order uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.orders where id = target_order and user_id = auth.uid()) then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;
  return private.cancel_order(target_order, 'canceled', 'customer_canceled');
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.store_settings enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.promotions enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security; -- no policies: service role only

-- Public catalog (read-only). Catalog writes go through the dashboard or the service role.
create policy "Anyone can read store settings" on public.store_settings
  for select to anon, authenticated using (true);

create policy "Anyone can read active shipping methods" on public.shipping_methods
  for select to anon, authenticated using (is_active);

create policy "Anyone can read active categories" on public.categories
  for select to anon, authenticated using (is_active);

create policy "Anyone can read active products" on public.products
  for select to anon, authenticated using (is_active);

create policy "Anyone can read images of active products" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active));

create policy "Anyone can read active variants" on public.product_variants
  for select to anon, authenticated
  using (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active));

create policy "Anyone can read live promotions" on public.promotions
  for select to anon, authenticated
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));

-- Profiles: own row only; role is not writable (see column grants below).
create policy "Users can view own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Address book: signed-in accounts only (guests type an address at checkout).
create policy "Users can view own addresses" on public.addresses
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Accounts can add addresses" on public.addresses
  for insert to authenticated
  with check ((select auth.uid()) = user_id and not (select public.is_guest_user()));

create policy "Accounts can update own addresses" on public.addresses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and not (select public.is_guest_user()));

create policy "Users can delete own addresses" on public.addresses
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Carts: read own; writes only through mutate_cart().
create policy "Users can view own carts" on public.carts
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own cart items" on public.cart_items
  for select to authenticated
  using (cart_id in (select id from public.carts where user_id = (select auth.uid())));

-- Orders: read own; never written from the browser.
create policy "Users can view own orders" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view own order items" on public.order_items
  for select to authenticated
  using (order_id in (select id from public.orders where user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Grants. Supabase grants everything on public tables to anon/authenticated by default;
-- tighten to what the policies above intend.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.store_settings, public.shipping_methods, public.categories, public.products,
  public.product_images, public.product_variants, public.promotions, public.product_listings
  to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.carts, public.cart_items, public.orders, public.order_items to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Functions: Postgres lets PUBLIC execute new functions; restrict each one.
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function public.is_guest_user() to anon, authenticated;
grant execute on function public.mutate_cart(text, uuid, integer) to authenticated;
grant execute on function public.create_checkout_order(text, uuid, jsonb, text, boolean) to authenticated;
grant execute on function public.cancel_my_pending_order(uuid) to authenticated;

grant execute on function public.attach_checkout_session(uuid, text) to service_role;
grant execute on function public.mark_order_paid(uuid, text, text, bigint, text) to service_role;
grant execute on function public.mark_order_unpaid(uuid, text) to service_role;
grant execute on function public.merge_guest_cart(uuid, uuid) to service_role;
