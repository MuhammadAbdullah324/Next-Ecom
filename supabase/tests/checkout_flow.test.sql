\set ON_ERROR_STOP 1
-- users: guest G, account A, account B
insert into auth.users (id, email, is_anonymous) values
 ('00000000-0000-0000-0000-00000000000a', 'a@example.com', false),
 ('00000000-0000-0000-0000-00000000000b', 'b@example.com', false),
 ('00000000-0000-0000-0000-000000000009', null, true);
select 'profiles created', count(*) from profiles;

create function pg_temp.as_user(u text, anon boolean) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u, false);
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'is_anonymous', anon)::text, false);
end $$;
create function pg_temp.expect_error(q text, pattern text) returns text language plpgsql as $$
begin
  execute q;
  raise exception 'EXPECTED ERROR matching % but query succeeded: %', pattern, q;
exception when others then
  if sqlerrm like 'EXPECTED ERROR%' then raise; end if;
  if sqlerrm !~* pattern then raise exception 'wrong error for %: %', q, sqlerrm; end if;
  return 'ok: ' || sqlerrm;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated, service_role;

-- 1. anon (no session) can browse, cannot touch cart
set role anon;
select 'anon listings', count(*), count(*) filter (where in_stock) from product_listings;
select 'anon search', name from product_listings where search @@ websearch_to_tsquery('english', 'noise cancelling');
select pg_temp.expect_error($q$select mutate_cart('add', (select id from product_variants where sku='ANK-20W-WHT'))$q$, 'permission denied');
select pg_temp.expect_error($q$select * from orders$q$, 'permission denied');
reset role;

-- 2. guest cart
select pg_temp.as_user('00000000-0000-0000-0000-000000000009', true);
set role authenticated;
select 'guest add', mutate_cart('add', (select id from product_variants where sku='ANK-20W-WHT'), 2) is not null;
select mutate_cart('add', (select id from product_variants where sku='ANK-20W-WHT'), 1);
select 'guest qty after 2 adds (expect 3)', quantity from cart_items;
select pg_temp.expect_error($q$select mutate_cart('add', (select id from product_variants where sku='BLK-MS-15W'))$q$, 'Only 0 left');
select pg_temp.expect_error($q$select mutate_cart('update', (select id from product_variants where sku='ANK-20W-WHT'), 999)$q$, 'Only 40 left');
select pg_temp.expect_error($q$insert into cart_items (cart_id, variant_id) select id, (select id from product_variants limit 1) from carts$q$, 'permission denied');
select pg_temp.expect_error($q$insert into addresses (user_id, full_name, phone, address_line_1, city, postal_code) values (auth.uid(), 'G','1','x','y','z')$q$, 'row-level security');
select pg_temp.expect_error($q$select create_checkout_order('standard', null, '{"full_name":"Guest"}'::jsonb, 'g@example.com')$q$, 'complete the delivery address');
select pg_temp.expect_error($q$select create_checkout_order('standard', null, '{"full_name":"Guest","phone":"1","address_line_1":"1 St","city":"Lahore","postal_code":"54000","country":"Pakistan"}'::jsonb, null)$q$, 'valid email');
select create_checkout_order('standard', null, '{"full_name":"Guest","phone":"1","address_line_1":"1 St","city":"Lahore","postal_code":"54000","country":"Pakistan"}'::jsonb, 'G@Example.com ') as gid \gset
select 'guest order', o.order_number, o.is_guest, o.email, o.subtotal, o.shipping_amount, o.tax_amount, o.total_amount, o.status, o.payment_status from orders o where o.id = :'gid';
reset role;
select 'stock reserved (expect 37)', stock_quantity from product_variants where sku='ANK-20W-WHT';

-- 3. checkout again supersedes the first attempt; then shopper cancels
set role authenticated;
select 'second attempt', create_checkout_order('express', null, '{"full_name":"Guest","phone":"1","address_line_1":"1 St","city":"Lahore","postal_code":"54000","country":"Pakistan"}'::jsonb, 'g@example.com') is not null;
select 'guest orders', order_number, status, payment_status, cancel_reason, shipping_amount, total_amount from orders order by created_at, order_number;
reset role;
select 'stock after supersede (expect 37)', stock_quantity from product_variants where sku='ANK-20W-WHT';
set role authenticated;
select 'cancel', cancel_my_pending_order((select id from orders where status='pending'));
reset role;
select 'stock after cancel (expect 40)', stock_quantity from product_variants where sku='ANK-20W-WHT';
select 'cart still active with item', c.status, ci.quantity from carts c join cart_items ci on ci.cart_id=c.id;

-- 4. guest signs in to account A: merge cart
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select mutate_cart('add', (select id from product_variants where sku='ANK-20W-WHT'), 1);
select mutate_cart('add', (select id from product_variants where sku='SC-ANC-BLK'), 1);
reset role;
set role service_role;
select 'merge', merge_guest_cart('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-00000000000a') is not null;
select pg_temp.expect_error($q$select merge_guest_cart('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')$q$, 'Only a guest cart');
reset role;
set role authenticated;
select 'A cart after merge (expect charger 4, anc 1)', v.sku, ci.quantity from cart_items ci join product_variants v on v.id=ci.variant_id order by v.sku;
select 'A sees guest orders now', count(*) from orders;
select pg_temp.expect_error($q$select merge_guest_cart('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-00000000000a')$q$, 'permission denied');

-- 5. account checkout with saved address, then paid
insert into addresses (user_id, label, full_name, phone, address_line_1, city, postal_code, is_default) values (auth.uid(), 'Home', 'Abdullah', '0300', '1 Mall Rd', 'Lahore', '54000', true);
insert into addresses (user_id, label, full_name, phone, address_line_1, city, postal_code, is_default) values (auth.uid(), 'Office', 'Abdullah', '0300', '2 Main Blvd', 'Lahore', '54000', true);
select 'defaults (expect Office only)', label, is_default from addresses order by label;
select pg_temp.expect_error($q$update profiles set role = 'admin'$q$, 'permission denied');
update profiles set full_name = 'Abdullah' where id = auth.uid();
select create_checkout_order('standard', (select id from addresses where label='Office')) as oid \gset
select 'A order', order_number, email, subtotal, shipping_amount, tax_amount, total_amount, shipping_address->>'address_line_1' from orders where id = :'oid';
select mutate_cart('add', (select id from product_variants where sku='UGR-3IN1'), 1); -- added while paying
reset role;
set role service_role;
select 'attach', attach_checkout_session(:'oid', 'cs_test_1');
select pg_temp.expect_error(format($q$select mark_order_paid(%L, 'cs_test_1', 'pi_1', 1, 'usd')$q$, :'oid'), 'does not match');
select pg_temp.expect_error(format($q$select mark_order_paid(%L, 'cs_other', 'pi_1', %s, 'usd')$q$, :'oid', (select round(total_amount*100)::bigint from orders where id=:'oid')), 'session does not match');
select 'paid', mark_order_paid(:'oid', 'cs_test_1', 'pi_1', (select round(total_amount*100)::bigint from orders where id=:'oid'), 'USD');
select 'paid again', mark_order_paid(:'oid', 'cs_test_1', 'pi_1', (select round(total_amount*100)::bigint from orders where id=:'oid'), 'usd');
select 'unpaid after paid', mark_order_unpaid(:'oid', 'failed');
select 'order', status, payment_status, paid_at is not null from orders where id = :'oid';
select 'carts of A', status, (select string_agg(v.sku||'x'||ci.quantity, ',') from cart_items ci join product_variants v on v.id=ci.variant_id where ci.cart_id=c.id) from carts c where user_id='00000000-0000-0000-0000-00000000000a' order by created_at;
select 'stock charger (expect 36)', stock_quantity from product_variants where sku='ANK-20W-WHT';
reset role;

-- 6. failure path and B isolation
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select create_checkout_order('express', (select id from addresses where label='Home')) as oid2 \gset
reset role;
set role service_role;
select 'failed', mark_order_unpaid(:'oid2', 'failed');
select pg_temp.expect_error(format($q$select mark_order_paid(%L, 'cs_x', 'pi_x', 100, 'usd')$q$, :'oid2'), 'cannot be paid');
select 'order2', status, payment_status, cancel_reason from orders where id=:'oid2';
reset role;
select 'stock 3in1 restored (expect 50)', stock_quantity from product_variants where sku='UGR-3IN1';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
select 'B sees orders/items/addresses/carts', (select count(*) from orders), (select count(*) from order_items), (select count(*) from addresses), (select count(*) from carts);
select pg_temp.expect_error(format($q$select create_checkout_order('standard', %L)$q$, (select id from addresses limit 1)), 'cart is empty');
select mutate_cart('add', (select id from product_variants where sku='ESR-TG-16'), 1);
select pg_temp.expect_error($q$select create_checkout_order('standard', (select id from public.addresses where label = 'Home' limit 1))$q$, 'complete the delivery address');
select pg_temp.expect_error($q$select cancel_my_pending_order((select id from orders limit 1))$q$, 'not found');
select pg_temp.expect_error($q$select mark_order_paid(gen_random_uuid(), 'x','y',1,'usd')$q$, 'permission denied');
select pg_temp.expect_error($q$update orders set status = 'confirmed'$q$, 'permission denied');
select pg_temp.expect_error($q$update product_variants set stock_quantity = 999$q$, 'permission denied');
reset role;
-- state consistency constraint
select pg_temp.expect_error($q$update orders set payment_status='paid' where status='canceled'$q$, 'orders_status_consistent');
