-- Tiny Threads: one-time switch from the earlier accessories catalog.
-- Run this once in the SQL Editor, then run seed.sql again.
-- It removes products, categories and promotions only. Accounts, addresses and orders stay;
-- past orders keep their item names and prices because order lines are snapshots.
-- Carts lose items whose product was removed.

begin;

delete from public.promotions;
delete from public.products;      -- also removes their images, variants and cart lines
delete from public.categories;

update public.store_settings set store_name = 'Tiny Threads';

commit;
