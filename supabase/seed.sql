-- Next Ecom: seed data for a mobile accessories store.
-- Run after the migration. Image URLs are placeholders (placehold.co); replace them with
-- uploads to a public Supabase Storage bucket such as `product-images`.

insert into public.store_settings (id, store_name, currency, tax_rate)
values (true, 'Next Ecom', 'usd', 0.0800)
on conflict (id) do update set store_name = excluded.store_name, currency = excluded.currency, tax_rate = excluded.tax_rate;

insert into public.shipping_methods (code, name, description, price, free_over, min_days, max_days, sort_order) values
  ('standard', 'Standard delivery', 'Tracked delivery to your door.', 5.00, 75.00, 3, 5, 1),
  ('express',  'Express delivery',  'Priority handling and next-day dispatch.', 15.00, null, 1, 2, 2)
on conflict (code) do nothing;

insert into public.categories (name, slug, description, sort_order) values
  ('Chargers',          'chargers',          'Fast wall and car chargers for every phone.', 1),
  ('Cables',            'cables',            'Durable USB-C, Lightning and multi-port cables.', 2),
  ('Power Banks',       'power-banks',       'Portable power for long days out.', 3),
  ('Earbuds',           'earbuds',           'Wireless earbuds with great sound and long battery.', 4),
  ('Phone Cases',       'phone-cases',       'Slim, rugged and MagSafe cases.', 5),
  ('Screen Protectors', 'screen-protectors', 'Tempered glass that keeps screens crack-free.', 6),
  ('Smart Watches',     'smart-watches',     'Fitness tracking and notifications on your wrist.', 7)
on conflict (slug) do nothing;

update public.categories
set image_url = 'https://placehold.co/600x400/png?text=' || replace(name, ' ', '+');

-- Products: (category slug, name, slug, brand, short description, description, price, compare_at, featured, specs)
insert into public.products (category_id, name, slug, brand, short_description, description, price, compare_at_price, is_featured, specs)
select c.id, v.name, v.slug, v.brand, v.short_description, v.description, v.price, v.compare_at, v.featured, v.specs::jsonb
from (values
  ('chargers', 'Anker 20W USB-C Fast Charger', 'anker-20w-usb-c-fast-charger', 'Anker',
   'Compact 20W USB-C charger.', 'Pocket-sized wall charger that takes most phones to 50% in about 30 minutes. Foldable plug, overheat protection.',
   24.99, 29.99, true, '{"Output": "20W", "Port": "1x USB-C", "Weight": "32 g"}'),
  ('chargers', 'Ugreen 65W GaN 3-Port Charger', 'ugreen-65w-gan-3-port-charger', 'Ugreen',
   'Charge a laptop, phone and earbuds at once.', 'Gallium nitride charger with two USB-C and one USB-A port. Powers most laptops at full speed.',
   49.99, null, true, '{"Output": "65W", "Ports": "2x USB-C, 1x USB-A", "Weight": "115 g"}'),
  ('chargers', 'Baseus Dual-Port Car Charger', 'baseus-dual-port-car-charger', 'Baseus',
   '30W fast charging on the road.', 'Flush-fit car charger with USB-C PD and USB-A Quick Charge.',
   17.99, 21.99, false, '{"Output": "30W", "Ports": "1x USB-C, 1x USB-A"}'),
  ('chargers', 'Belkin 15W MagSafe Wireless Pad', 'belkin-15w-magsafe-wireless-pad', 'Belkin',
   'Snap-on magnetic wireless charging.', 'Magnetic wireless charger that aligns automatically with MagSafe phones and cases.',
   39.99, null, false, '{"Output": "15W", "Cable": "1.5 m USB-C"}'),
  ('cables', 'Braided USB-C to USB-C Cable', 'braided-usb-c-to-usb-c-cable', 'Anker',
   '100W braided cable that survives daily use.', 'Double-braided nylon cable rated for 10,000+ bends. Supports 100W charging and USB 2.0 data.',
   12.99, null, false, '{"Power": "100W", "Data": "480 Mbps"}'),
  ('cables', 'USB-C to Lightning Cable', 'usb-c-to-lightning-cable', 'Belkin',
   'MFi-certified fast charging for iPhone.', 'Apple MFi-certified cable for fast charging older iPhones from any USB-C charger.',
   16.99, 19.99, false, '{"Certification": "MFi", "Power": "27W"}'),
  ('cables', '3-in-1 Multi Charging Cable', '3-in-1-multi-charging-cable', 'Ugreen',
   'USB-C, Lightning and Micro-USB in one.', 'One cable for every device in the bag. Charges up to three devices at once.',
   14.99, null, false, '{"Connectors": "USB-C, Lightning, Micro-USB", "Length": "1.2 m"}'),
  ('power-banks', '10,000mAh Slim Power Bank', '10000mah-slim-power-bank', 'Anker',
   'Two full phone charges in your pocket.', 'Slim 10,000mAh power bank with 20W USB-C PD in and out.',
   29.99, 34.99, true, '{"Capacity": "10,000mAh", "Output": "20W", "Weight": "190 g"}'),
  ('power-banks', '20,000mAh Power Bank with Display', '20000mah-power-bank-with-display', 'Baseus',
   'Big capacity with a battery percentage display.', 'Charge three devices at once and see exactly how much power is left.',
   44.99, null, false, '{"Capacity": "20,000mAh", "Output": "22.5W", "Ports": "2x USB-A, 1x USB-C"}'),
  ('power-banks', 'MagSafe Magnetic Battery Pack', 'magsafe-magnetic-battery-pack', 'Belkin',
   'Snaps onto your iPhone and charges wirelessly.', 'Magnetic 5,000mAh battery with kickstand. Charges wirelessly or by USB-C.',
   49.99, 59.99, false, '{"Capacity": "5,000mAh", "Wireless": "7.5W"}'),
  ('earbuds', 'Wireless Bluetooth Earbuds', 'wireless-bluetooth-earbuds', 'Soundcore',
   'Clear sound and a pocketable charging case.', 'Comfortable everyday earbuds with 8 hours of playback and 32 more from the case.',
   39.99, 49.99, true, '{"Battery": "8 h + 32 h case", "Bluetooth": "5.3", "Water resistance": "IPX5"}'),
  ('earbuds', 'Noise-Cancelling Earbuds Pro', 'noise-cancelling-earbuds-pro', 'Soundcore',
   'Adaptive ANC with transparency mode.', 'Hybrid active noise cancelling, six microphones for calls, wireless charging case.',
   89.99, 109.99, true, '{"Battery": "10 h + 40 h case", "ANC": "Adaptive", "Charging": "USB-C, Qi"}'),
  ('earbuds', 'Sport Open-Ear Earbuds', 'sport-open-ear-earbuds', 'Shokz',
   'Open-ear design that stays put on runs.', 'Ear-hook earbuds that keep you aware of traffic. Sweat-proof.',
   69.99, null, false, '{"Battery": "9 h", "Water resistance": "IP55"}'),
  ('phone-cases', 'Clear MagSafe Case for iPhone 16', 'clear-magsafe-case-iphone-16', 'Spigen',
   'Crystal-clear case that resists yellowing.', 'Slim clear case with built-in magnets and raised edges for camera and screen.',
   19.99, null, false, '{"Compatibility": "iPhone 16", "MagSafe": "Yes"}'),
  ('phone-cases', 'Rugged Armor Case for Galaxy S25', 'rugged-armor-case-galaxy-s25', 'Spigen',
   'Drop protection without the bulk.', 'Flexible TPU with air-cushion corners, tested to 2 m drops.',
   15.99, 19.99, false, '{"Compatibility": "Galaxy S25", "Drop rating": "2 m"}'),
  ('phone-cases', 'Silicone Case for iPhone 16 Pro', 'silicone-case-iphone-16-pro', 'Nillkin',
   'Soft-touch silicone with microfiber lining.', 'Grippy silicone exterior, soft lining inside, and MagSafe magnets.',
   24.99, null, true, '{"Compatibility": "iPhone 16 Pro", "MagSafe": "Yes"}'),
  ('screen-protectors', 'Tempered Glass Protector for iPhone 16 (2-pack)', 'tempered-glass-iphone-16-2-pack', 'ESR',
   '9H glass with an easy-install frame.', 'Case-friendly tempered glass with an alignment frame for bubble-free installation.',
   11.99, 14.99, false, '{"Hardness": "9H", "Pack": "2"}'),
  ('screen-protectors', 'Privacy Glass for Galaxy S25', 'privacy-glass-galaxy-s25', 'ESR',
   'Keeps your screen private from side angles.', 'Privacy filter tempered glass that darkens the screen beyond 30 degrees.',
   16.99, null, false, '{"Hardness": "9H", "Privacy angle": "30 degrees"}'),
  ('smart-watches', 'Fitness Smart Watch Active', 'fitness-smart-watch-active', 'Amazfit',
   'Heart rate, sleep and GPS with 14-day battery.', 'Lightweight smart watch with built-in GPS, 120+ sport modes and a bright AMOLED screen.',
   79.99, 99.99, true, '{"Battery": "14 days", "GPS": "Built-in", "Water resistance": "5 ATM"}'),
  ('smart-watches', 'Kids GPS Smart Watch', 'kids-gps-smart-watch', 'Xplora',
   'Calls, location and SOS for kids.', 'Kids smart watch with GPS tracking, approved contacts and an SOS button. Requires a nano SIM.',
   119.99, null, false, '{"Connectivity": "4G", "Battery": "2 days"}'),
  ('smart-watches', 'Classic Leather Watch Strap', 'classic-leather-watch-strap', 'Amazfit',
   'Genuine leather strap with quick-release pins.', 'Swap straps in seconds. Fits standard 22 mm watch lugs.',
   19.99, null, false, '{"Width": "22 mm", "Material": "Leather"}')
) as v(category_slug, name, slug, brand, short_description, description, price, compare_at, featured, specs)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Images: two per product, placeholder URLs labelled with the product name.
insert into public.product_images (product_id, url, alt_text, sort_order)
select p.id,
       'https://placehold.co/800x800/png?text=' || replace(p.name, ' ', '+') || case when n = 2 then '+(back)' else '' end,
       p.name || case when n = 2 then ', alternate view' else '' end,
       n
from public.products p
cross join generate_series(1, 2) n
where not exists (select 1 from public.product_images i where i.product_id = p.id);

-- Variants: (product slug, sku, name, options, price override, stock, default)
insert into public.product_variants (product_id, sku, name, options, price, stock_quantity, is_default, sort_order)
select p.id, v.sku, v.name, v.options::jsonb, v.price, v.stock, v.is_default, v.sort_order
from (values
  ('anker-20w-usb-c-fast-charger',    'ANK-20W-WHT', 'White',             '{"Color": "White"}',                   null::numeric, 40, true,  1),
  ('anker-20w-usb-c-fast-charger',    'ANK-20W-BLK', 'Black',             '{"Color": "Black"}',                   null, 25, false, 2),
  ('ugreen-65w-gan-3-port-charger',   'UGR-65W',     'Default',           '{}',                                   null, 18, true,  1),
  ('baseus-dual-port-car-charger',    'BAS-CAR-30W', 'Default',           '{}',                                   null, 30, true,  1),
  ('belkin-15w-magsafe-wireless-pad', 'BLK-MS-15W',  'Default',           '{}',                                   null, 0,  true,  1),
  ('braided-usb-c-to-usb-c-cable',    'ANK-CC-1M-BLK', 'Black / 1 m',     '{"Color": "Black", "Length": "1 m"}',  null, 60, true,  1),
  ('braided-usb-c-to-usb-c-cable',    'ANK-CC-2M-BLK', 'Black / 2 m',     '{"Color": "Black", "Length": "2 m"}',  14.99, 45, false, 2),
  ('braided-usb-c-to-usb-c-cable',    'ANK-CC-1M-RED', 'Red / 1 m',       '{"Color": "Red", "Length": "1 m"}',    null, 20, false, 3),
  ('braided-usb-c-to-usb-c-cable',    'ANK-CC-2M-RED', 'Red / 2 m',       '{"Color": "Red", "Length": "2 m"}',    14.99, 0, false, 4),
  ('usb-c-to-lightning-cable',        'BLK-CL-1M',   '1 m',               '{"Length": "1 m"}',                    null, 35, true,  1),
  ('usb-c-to-lightning-cable',        'BLK-CL-2M',   '2 m',               '{"Length": "2 m"}',                    19.99, 15, false, 2),
  ('3-in-1-multi-charging-cable',     'UGR-3IN1',    'Default',           '{}',                                   null, 50, true,  1),
  ('10000mah-slim-power-bank',        'ANK-PB10-BLK', 'Black',            '{"Color": "Black"}',                   null, 22, true,  1),
  ('10000mah-slim-power-bank',        'ANK-PB10-BLU', 'Blue',             '{"Color": "Blue"}',                    null, 8,  false, 2),
  ('20000mah-power-bank-with-display','BAS-PB20',    'Default',           '{}',                                   null, 12, true,  1),
  ('magsafe-magnetic-battery-pack',   'BLK-MSPB',    'Default',           '{}',                                   null, 3,  true,  1),
  ('wireless-bluetooth-earbuds',      'SC-EB-BLK',   'Black',             '{"Color": "Black"}',                   null, 30, true,  1),
  ('wireless-bluetooth-earbuds',      'SC-EB-WHT',   'White',             '{"Color": "White"}',                   null, 18, false, 2),
  ('noise-cancelling-earbuds-pro',    'SC-ANC-BLK',  'Midnight Black',    '{"Color": "Midnight Black"}',          null, 14, true,  1),
  ('noise-cancelling-earbuds-pro',    'SC-ANC-BLU',  'Ocean Blue',        '{"Color": "Ocean Blue"}',              null, 6,  false, 2),
  ('sport-open-ear-earbuds',          'SHK-OPEN',    'Default',           '{}',                                   null, 10, true,  1),
  ('clear-magsafe-case-iphone-16',    'SPG-CLR-16',  'Default',           '{}',                                   null, 40, true,  1),
  ('rugged-armor-case-galaxy-s25',    'SPG-RA-S25-BLK', 'Matte Black',    '{"Color": "Matte Black"}',             null, 25, true,  1),
  ('rugged-armor-case-galaxy-s25',    'SPG-RA-S25-GRN', 'Abyss Green',    '{"Color": "Abyss Green"}',             null, 9,  false, 2),
  ('silicone-case-iphone-16-pro',     'NLK-SIL-16P-BLK', 'Black',         '{"Color": "Black"}',                   null, 20, true,  1),
  ('silicone-case-iphone-16-pro',     'NLK-SIL-16P-PNK', 'Pink',          '{"Color": "Pink"}',                    null, 12, false, 2),
  ('silicone-case-iphone-16-pro',     'NLK-SIL-16P-SAG', 'Sage',          '{"Color": "Sage"}',                    null, 0,  false, 3),
  ('tempered-glass-iphone-16-2-pack', 'ESR-TG-16',   'Default',           '{}',                                   null, 80, true,  1),
  ('privacy-glass-galaxy-s25',        'ESR-PRV-S25', 'Default',           '{}',                                   null, 26, true,  1),
  ('fitness-smart-watch-active',      'AMZ-ACT-BLK', 'Black / 42 mm',     '{"Color": "Black", "Size": "42 mm"}',  null, 10, true,  1),
  ('fitness-smart-watch-active',      'AMZ-ACT-BLK-46', 'Black / 46 mm',  '{"Color": "Black", "Size": "46 mm"}',  89.99, 7, false, 2),
  ('fitness-smart-watch-active',      'AMZ-ACT-PNK', 'Pink / 42 mm',      '{"Color": "Pink", "Size": "42 mm"}',   null, 5,  false, 3),
  ('kids-gps-smart-watch',            'XPL-KIDS-BLU', 'Blue',             '{"Color": "Blue"}',                    null, 6,  true,  1),
  ('kids-gps-smart-watch',            'XPL-KIDS-PNK', 'Pink',             '{"Color": "Pink"}',                    null, 4,  false, 2),
  ('classic-leather-watch-strap',     'AMZ-STRAP-BRN', 'Brown',           '{"Color": "Brown"}',                   null, 15, true,  1),
  ('classic-leather-watch-strap',     'AMZ-STRAP-BLK', 'Black',           '{"Color": "Black"}',                   null, 15, false, 2)
) as v(product_slug, sku, name, options, price, stock, is_default, sort_order)
join public.products p on p.slug = v.product_slug
on conflict (sku) do nothing;

insert into public.promotions (placement, title, subtitle, cta_label, cta_href, image_url, sort_order)
select * from (values
  ('hero',   'Power that keeps up with you', 'Fast chargers and power banks from Anker, Ugreen and Baseus.', 'Shop charging', '/category/chargers',
   'https://placehold.co/1600x700/png?text=Power+that+keeps+up', 1),
  ('hero',   'Hear more, carry less', 'Noise-cancelling earbuds now up to 20% off.', 'Shop earbuds', '/category/earbuds',
   'https://placehold.co/1600x700/png?text=Hear+more', 2),
  ('banner', 'Free standard delivery over $75', 'Applied automatically at checkout.', null, null, null, 1)
) as v(placement, title, subtitle, cta_label, cta_href, image_url, sort_order)
where not exists (select 1 from public.promotions);
