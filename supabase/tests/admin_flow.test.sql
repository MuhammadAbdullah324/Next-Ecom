\set ON_ERROR_STOP 1
-- Admin dashboard rules. Run after checkout_flow.test.sql in the same session database
-- (it reuses accounts A and B and their orders). See README.md.

create or replace function pg_temp.as_user(u text, anon boolean) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u, false);
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'is_anonymous', anon)::text, false);
end $$;
create or replace function pg_temp.expect_error(q text, pattern text) returns text language plpgsql as $$
begin
  execute q;
  raise exception 'EXPECTED ERROR matching % but query succeeded: %', pattern, q;
exception when others then
  if sqlerrm like 'EXPECTED ERROR%' then raise; end if;
  if sqlerrm !~* pattern then raise exception 'wrong error for %: %', q, sqlerrm; end if;
  return 'ok: ' || sqlerrm;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated, service_role;

-- A customer is refused everywhere.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
select 'B is admin (expect f)', is_admin();
select pg_temp.expect_error($q$select admin_dashboard_stats()$q$, 'Only store admins');
select pg_temp.expect_error($q$select admin_set_role('00000000-0000-0000-0000-00000000000b', 'admin')$q$, 'Only store admins');
select pg_temp.expect_error($q$insert into categories (name, slug) values ('Hack', 'hack')$q$, 'row-level security');
with u as (update products set price = 0 returning 1) select 'customer product update rows (expect 0)', count(*) from u;
select 'customer sees other orders (expect 0)', count(*) from orders where user_id <> auth.uid();
reset role;

-- A becomes admin (the documented SQL), then manages the store.
update profiles set role = 'admin' where email = 'a@example.com';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select 'A is admin (expect t)', is_admin();
select 'A sees every order', count(*) = (select count(*) from orders) from orders;
select 'A sees every profile (expect 3)', count(*) from profiles;
select 'stats keys', admin_dashboard_stats(7) ?& array['revenue', 'paid_orders', 'to_fulfill', 'daily', 'low_stock'];
select 'stats daily rows (expect 7)', jsonb_array_length(admin_dashboard_stats(7) -> 'daily');

insert into categories (name, slug, is_active) values ('Hidden', 'hidden', false);
insert into products (category_id, name, slug, price, is_active)
  values ((select id from categories where slug = 'hidden'), 'Draft tee', 'draft-tee', 10, false);
insert into product_variants (product_id, sku, name, stock_quantity, is_default)
  values ((select id from products where slug = 'draft-tee'), 'DRAFT-1', 'Default', 3, true);
select 'admin sees hidden product (expect 1)', count(*) from products where slug = 'draft-tee';
update product_variants set stock_quantity = 7 where sku = 'DRAFT-1';
insert into promotions (placement, page, category_id, title)
  values ('hero', 'category', (select id from categories where slug = 'hidden'), 'Hidden hero');
select pg_temp.expect_error($q$insert into promotions (placement, page, title) values ('hero', 'all', 'x')$q$, 'promotions_all_pages_banner_only');
select pg_temp.expect_error($q$insert into promotions (placement, page, category_id, title) values ('hero', 'home', (select id from categories limit 1), 'x')$q$, 'promotions_category_page_only');
select pg_temp.expect_error($q$delete from categories where slug = 'hidden'$q$, 'foreign key');
update store_settings set tax_rate = 0.05;

select pg_temp.expect_error($q$select admin_set_role(auth.uid(), 'customer')$q$, 'own admin access');
select pg_temp.expect_error($q$select admin_set_role('00000000-0000-0000-0000-000000000009', 'admin')$q$, 'Guest');
reset role;

set role anon;
select 'anon hidden product (expect 0)', count(*) from products where slug = 'draft-tee';
reset role;
select 'stock now 7', stock_quantity from product_variants where sku = 'DRAFT-1';

-- Fulfillment and cancel/refund on a fresh paid order and a fresh pending order.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
select mutate_cart('add', (select id from product_variants where sku = 'WK-SOCK'), 2);
select create_checkout_order('standard', null,
  '{"full_name":"B","phone":"1","address_line_1":"1 St","city":"Lahore","postal_code":"54000","country":"Pakistan"}'::jsonb) as paid_oid \gset
reset role;
select mark_order_paid(:'paid_oid', 'cs_admin', 'pi_admin', (select round(total_amount * 100)::bigint from orders where id = :'paid_oid'), 'usd');
select stock_quantity as sock_after_paid from product_variants where sku = 'WK-SOCK' \gset

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select 'ship', admin_set_order_status(:'paid_oid', 'shipped');
select pg_temp.expect_error(format($q$select admin_set_order_status(%L, 'pending')$q$, :'paid_oid'), 'Choose confirmed');
select 'refund', admin_cancel_order(:'paid_oid', true);
select 'refunded order', status, payment_status, cancel_reason from orders where id = :'paid_oid';
select pg_temp.expect_error(format($q$select admin_set_order_status(%L, 'shipped')$q$, :'paid_oid'), 'Only paid orders');
reset role;
select 'socks restocked (expect t)', stock_quantity - :sock_after_paid = (select quantity from order_items where order_id = :'paid_oid')
from product_variants where sku = 'WK-SOCK';

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
select mutate_cart('add', (select id from product_variants where sku = 'WK-SOCK'), 1);
select create_checkout_order('standard', null,
  '{"full_name":"B","phone":"1","address_line_1":"1 St","city":"Lahore","postal_code":"54000","country":"Pakistan"}'::jsonb) as pending_oid \gset
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select 'cancel pending', admin_cancel_order(:'pending_oid');
select 'canceled pending order', status, payment_status, cancel_reason from orders where id = :'pending_oid';
reset role;
select 'admin tests done';
