-- Tiny Threads: seed data for a kids' clothing store.
-- Run after the migration. Photos are free Unsplash images (https://unsplash.com/license) loaded from
-- images.unsplash.com; swap them for your own product photos, e.g. a public Supabase Storage bucket.
-- Already seeded the earlier accessories catalog? Run replace-catalog.sql first.

insert into public.store_settings (id, store_name, currency, tax_rate)
values (true, 'Tiny Threads', 'usd', 0.0800)
on conflict (id) do update set store_name = excluded.store_name, currency = excluded.currency, tax_rate = excluded.tax_rate;

insert into public.shipping_methods (code, name, description, price, free_over, min_days, max_days, sort_order) values
  ('standard', 'Standard delivery', 'Tracked delivery to your door.', 5.00, 75.00, 3, 5, 1),
  ('express',  'Express delivery',  'Priority handling and next-day dispatch.', 15.00, null, 1, 2, 2)
on conflict (code) do nothing;

insert into public.categories (name, slug, description, sort_order) values
  ('Baby',                'baby',                'Soft essentials for 0 to 24 months.', 1),
  ('Tops & Tees',         'tops-tees',           'Everyday tees, sweatshirts and hoodies.', 2),
  ('Dresses',             'dresses',             'Twirl-ready dresses for play days and parties.', 3),
  ('Pants & Shorts',      'pants-shorts',        'Jeans, joggers and shorts built for climbing.', 4),
  ('Outerwear',           'outerwear',           'Jackets and vests for rain, wind and cold.', 5),
  ('Sleepwear',           'sleepwear',           'Cozy pajamas and sleep sacks.', 6),
  ('Shoes & Accessories', 'shoes-accessories',   'Sneakers, socks and hats to finish the look.', 7)
on conflict (slug) do nothing;

update public.categories c
set image_url = v.url
from (values
  ('baby', 'https://images.unsplash.com/photo-1569974641446-22542de88536?auto=format&fit=crop&w=600&h=400&q=80'),
  ('tops-tees', 'https://images.unsplash.com/photo-1595930013415-ca6958dc8a8a?auto=format&fit=crop&w=600&h=400&q=80'),
  ('dresses', 'https://images.unsplash.com/photo-1621163327889-581607524821?auto=format&fit=crop&w=600&h=400&q=80'),
  ('pants-shorts', 'https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?auto=format&fit=crop&w=600&h=400&q=80'),
  ('outerwear', 'https://images.unsplash.com/photo-1758535291260-d02ee9ae1ceb?auto=format&fit=crop&w=600&h=400&q=80'),
  ('sleepwear', 'https://images.unsplash.com/photo-1771419912747-df33d91c329d?auto=format&fit=crop&w=600&h=400&q=80'),
  ('shoes-accessories', 'https://images.unsplash.com/photo-1766129486324-2d8894484750?auto=format&fit=crop&w=600&h=400&q=80')
) as v(slug, url)
where c.slug = v.slug and c.image_url is null;

-- Products: (category slug, name, slug, brand, short description, description, price, compare_at, featured, specs)
insert into public.products (category_id, name, slug, brand, short_description, description, price, compare_at_price, is_featured, specs)
select c.id, v.name, v.slug, v.brand, v.short_description, v.description, v.price, v.compare_at, v.featured, v.specs::jsonb
from (values
  ('baby', 'Organic Cotton Bodysuit 3-Pack', 'organic-cotton-bodysuit-3-pack', 'Little Sprout',
   'Three short-sleeve bodysuits in GOTS organic cotton.', 'Envelope shoulders for easy changes and snap closures at the bottom. Gentle on sensitive skin.',
   24.99, 29.99, true, '{"Material": "100% organic cotton", "Pack": "3", "Care": "Machine wash warm"}'),
  ('baby', 'Ribbed Knit Romper', 'ribbed-knit-romper', 'Little Sprout',
   'Stretchy ribbed romper with snap legs.', 'A one-piece outfit that moves with crawling babies. Snaps from neck to ankle.',
   19.99, null, false, '{"Material": "95% cotton, 5% elastane", "Closure": "Snaps"}'),
  ('baby', 'Chunky Knit Baby Cardigan', 'chunky-knit-baby-cardigan', 'Pebble & Co',
   'Button-up cardigan for chilly mornings.', 'Soft cotton knit with wooden-look buttons and ribbed cuffs.',
   27.99, 34.99, false, '{"Material": "100% cotton knit", "Closure": "Buttons"}'),
  ('tops-tees', 'Striped Cotton Tee', 'striped-cotton-tee', 'Sunny Days',
   'Classic breton stripes in soft jersey.', 'Pre-washed cotton tee that keeps its shape wash after wash. Tagless neck label.',
   12.99, null, true, '{"Material": "100% cotton jersey", "Fit": "Regular"}'),
  ('tops-tees', 'Dino Graphic Tee', 'dino-graphic-tee', 'Wildflower Kids',
   'Roaring dinosaur print on a crew-neck tee.', 'Water-based print that stays bright and soft. Relaxed fit for play.',
   14.99, null, false, '{"Material": "100% cotton", "Print": "Water-based ink"}'),
  ('tops-tees', 'Rainbow Pullover Hoodie', 'rainbow-pullover-hoodie', 'Wildflower Kids',
   'Brushed-back hoodie with a rainbow chest stripe.', 'Kangaroo pocket, lined hood and ribbed cuffs. Warm without being bulky.',
   29.99, 36.99, true, '{"Material": "80% cotton, 20% polyester", "Pocket": "Kangaroo"}'),
  ('dresses', 'Floral Twirl Dress', 'floral-twirl-dress', 'Sunny Days',
   'Full skirt made for spinning.', 'Lightweight cotton dress with a gathered skirt, flutter sleeves and hidden shorts underneath.',
   26.99, 32.99, true, '{"Material": "100% cotton poplin", "Lining": "Built-in shorts"}'),
  ('dresses', 'Denim Pinafore Dress', 'denim-pinafore-dress', 'Pebble & Co',
   'Soft denim pinafore with button straps.', 'Layer over a tee or turtleneck. Adjustable straps grow with your child.',
   24.99, null, false, '{"Material": "Cotton denim", "Straps": "Adjustable"}'),
  ('dresses', 'Party Tulle Dress', 'party-tulle-dress', 'Wildflower Kids',
   'Sparkly tulle skirt with a satin bodice.', 'Soft lining keeps the tulle from scratching. Back zip with a ribbon tie.',
   34.99, null, false, '{"Material": "Polyester tulle, cotton lining", "Closure": "Back zip"}'),
  ('pants-shorts', 'Stretch Denim Jeans', 'stretch-denim-jeans', 'Pebble & Co',
   'Slim jeans with an adjustable waist.', 'Stretch denim with reinforced knees and inside waist adjusters.',
   22.99, null, false, '{"Material": "98% cotton, 2% elastane", "Waist": "Adjustable"}'),
  ('pants-shorts', 'Everyday Jogger Pants', 'everyday-jogger-pants', 'Sunny Days',
   'Soft joggers with cuffed ankles.', 'Elastic waist with a drawcord, side pockets and knees that hold up to the playground.',
   17.99, 21.99, true, '{"Material": "French terry cotton", "Waist": "Elastic with drawcord"}'),
  ('pants-shorts', 'Cargo Play Shorts', 'cargo-play-shorts', 'Wildflower Kids',
   'Pull-on shorts with roomy cargo pockets.', 'Durable cotton twill with an elastic back waist. Plenty of room for treasures.',
   15.99, null, false, '{"Material": "100% cotton twill", "Pockets": "6"}'),
  ('outerwear', 'Puddle Rain Jacket', 'puddle-rain-jacket', 'Puddle Jumpers',
   'Waterproof jacket with sealed seams.', 'Breathable waterproof shell with a stowaway hood and reflective trim for darker days.',
   39.99, 49.99, true, '{"Waterproof": "5,000 mm", "Hood": "Stowaway", "Reflective": "Yes"}'),
  ('outerwear', 'Fleece-Lined Winter Parka', 'fleece-lined-winter-parka', 'Puddle Jumpers',
   'Warm parka with a fleece lining.', 'Water-resistant outer, fleece lining and a faux-fur trimmed hood for cold winter walks.',
   64.99, null, false, '{"Lining": "Fleece", "Hood": "Detachable faux-fur trim"}'),
  ('outerwear', 'Quilted Puffer Vest', 'quilted-puffer-vest', 'Pebble & Co',
   'Lightweight vest that packs into its pocket.', 'Recycled insulation keeps the core warm while arms stay free to climb.',
   29.99, null, false, '{"Insulation": "Recycled polyester", "Packable": "Yes"}'),
  ('sleepwear', 'Dinosaur Pajama Set', 'dinosaur-pajama-set', 'Little Sprout',
   'Snug-fit cotton pajamas with dinosaurs.', 'Long-sleeve top and pants in snug-fit cotton.',
   18.99, null, false, '{"Material": "100% cotton", "Fit": "Snug"}'),
  ('sleepwear', 'Starry Night Pajama Set', 'starry-night-pajama-set', 'Sunny Days',
   'Glow-in-the-dark stars on soft jersey.', 'Two-piece pajamas printed with stars that glow softly at bedtime.',
   22.99, 26.99, false, '{"Material": "100% cotton jersey", "Print": "Glow-in-the-dark"}'),
  ('sleepwear', 'Cozy Fleece Sleep Sack', 'cozy-fleece-sleep-sack', 'Little Sprout',
   'Wearable blanket for safe, warm sleep.', 'Sleeveless sleep sack with a two-way zip for easy night changes.',
   29.99, null, true, '{"Material": "Polyester fleece", "TOG": "2.5", "Zip": "Two-way"}'),
  ('shoes-accessories', 'Cotton Sun Hat', 'cotton-sun-hat', 'Sunny Days',
   'Wide-brim hat with a chin strap.', 'UPF 50+ cotton hat that folds flat for the beach bag.',
   12.99, null, false, '{"Protection": "UPF 50+", "Size": "One size (2-6 years)"}'),
  ('shoes-accessories', 'Rainbow Socks 5-Pack', 'rainbow-socks-5-pack', 'Wildflower Kids',
   'Five pairs of bright, non-slip socks.', 'Cotton-rich socks with grippy soles for slippery floors.',
   11.99, 14.99, false, '{"Material": "Cotton blend", "Pack": "5", "Soles": "Non-slip"}'),
  ('shoes-accessories', 'Light-Up Sneakers', 'light-up-sneakers', 'Puddle Jumpers',
   'Sneakers that flash with every step.', 'Hook-and-loop straps for easy on and off. Lights need no charging.',
   34.99, 39.99, true, '{"Closure": "Hook and loop", "Lights": "Motion-activated"}')
) as v(category_slug, name, slug, brand, short_description, description, price, compare_at, featured, specs)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Images: two photos per product.
insert into public.product_images (product_id, url, alt_text, sort_order)
select p.id, v.url, p.name || case when v.n = 2 then ', alternate view' else '' end, v.n
from (values
  ('organic-cotton-bodysuit-3-pack', 1, 'https://images.unsplash.com/photo-1569974641446-22542de88536?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('organic-cotton-bodysuit-3-pack', 2, 'https://images.unsplash.com/photo-1622290291720-ac961c43ee30?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('ribbed-knit-romper', 1, 'https://images.unsplash.com/photo-1622290319146-7b63df48a635?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('ribbed-knit-romper', 2, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('chunky-knit-baby-cardigan', 1, 'https://images.unsplash.com/photo-1758981400298-78cd18eb6793?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('chunky-knit-baby-cardigan', 2, 'https://images.unsplash.com/photo-1589437806467-9c28e135d9b5?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('striped-cotton-tee', 1, 'https://images.unsplash.com/photo-1595930013415-ca6958dc8a8a?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('striped-cotton-tee', 2, 'https://images.unsplash.com/photo-1627639678910-be8329e36789?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('dino-graphic-tee', 1, 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('dino-graphic-tee', 2, 'https://images.unsplash.com/photo-1622290291165-d341f1938b8a?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('rainbow-pullover-hoodie', 1, 'https://images.unsplash.com/photo-1631084412577-9f4d5829be98?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('rainbow-pullover-hoodie', 2, 'https://images.unsplash.com/photo-1775836214324-843581b270ee?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('floral-twirl-dress', 1, 'https://images.unsplash.com/photo-1621163327889-581607524821?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('floral-twirl-dress', 2, 'https://images.unsplash.com/photo-1611003967145-fb3960072424?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('denim-pinafore-dress', 1, 'https://images.unsplash.com/photo-1599624427857-461fd60c23e5?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('denim-pinafore-dress', 2, 'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('party-tulle-dress', 1, 'https://images.unsplash.com/photo-1759313560250-3bb4bc1d10bc?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('party-tulle-dress', 2, 'https://images.unsplash.com/photo-1620774760711-caa4c94d683a?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('stretch-denim-jeans', 1, 'https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('stretch-denim-jeans', 2, 'https://images.unsplash.com/photo-1637069585336-827b298fe84a?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('everyday-jogger-pants', 1, 'https://images.unsplash.com/photo-1781369068097-32ba353516ec?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('everyday-jogger-pants', 2, 'https://images.unsplash.com/photo-1555895417-90b96a0485b5?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('cargo-play-shorts', 1, 'https://images.unsplash.com/photo-1632337950445-ba446cb0e26f?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('cargo-play-shorts', 2, 'https://images.unsplash.com/photo-1521429581070-00d6fe8f3185?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('puddle-rain-jacket', 1, 'https://images.unsplash.com/photo-1758535291260-d02ee9ae1ceb?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('puddle-rain-jacket', 2, 'https://images.unsplash.com/photo-1781735974892-360b1cbf8765?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('fleece-lined-winter-parka', 1, 'https://images.unsplash.com/photo-1662787271649-8843cc38454a?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('fleece-lined-winter-parka', 2, 'https://images.unsplash.com/photo-1770954179469-de30aec1cb7e?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('quilted-puffer-vest', 1, 'https://images.unsplash.com/photo-1770996869979-7d20bd6b28e7?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('quilted-puffer-vest', 2, 'https://images.unsplash.com/photo-1606251032232-1a11b59e7f2f?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('dinosaur-pajama-set', 1, 'https://images.unsplash.com/photo-1759408174266-8b11788dff30?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('dinosaur-pajama-set', 2, 'https://images.unsplash.com/photo-1783514508938-39b933a59cf8?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('starry-night-pajama-set', 1, 'https://images.unsplash.com/photo-1771419912747-df33d91c329d?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('starry-night-pajama-set', 2, 'https://images.unsplash.com/photo-1603883436429-19509bedae92?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('cozy-fleece-sleep-sack', 1, 'https://images.unsplash.com/photo-1517588487680-fc59cb1a55cf?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('cozy-fleece-sleep-sack', 2, 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('cotton-sun-hat', 1, 'https://images.unsplash.com/photo-1590480598135-3be152c87913?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('cotton-sun-hat', 2, 'https://images.unsplash.com/photo-1786036837573-e3b4a80e3d77?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('rainbow-socks-5-pack', 1, 'https://images.unsplash.com/photo-1542355581-caf7454785ca?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('rainbow-socks-5-pack', 2, 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('light-up-sneakers', 1, 'https://images.unsplash.com/photo-1766129486324-2d8894484750?auto=format&fit=crop&w=1000&h=1000&q=80'),
  ('light-up-sneakers', 2, 'https://images.unsplash.com/photo-1678192568478-9488ee55def6?auto=format&fit=crop&w=1000&h=1000&q=80')
) as v(slug, n, url)
join public.products p on p.slug = v.slug
where not exists (select 1 from public.product_images i where i.product_id = p.id);

-- Variants: (product slug, sku, name, options, price override, stock, default)
insert into public.product_variants (product_id, sku, name, options, price, stock_quantity, is_default, sort_order)
select p.id, v.sku, v.name, v.options::jsonb, v.price, v.stock, v.is_default, v.sort_order
from (values
  ('organic-cotton-bodysuit-3-pack', 'LS-BODY-0-3',  '0-3M',             '{"Size": "0-3M"}',                       null::numeric, 40, true,  1),
  ('organic-cotton-bodysuit-3-pack', 'LS-BODY-3-6',  '3-6M',             '{"Size": "3-6M"}',                       null, 25, false, 2),
  ('organic-cotton-bodysuit-3-pack', 'LS-BODY-6-12', '6-12M',            '{"Size": "6-12M"}',                      null, 20, false, 3),
  ('ribbed-knit-romper',             'LS-ROMP-OAT-3-6',  'Oat / 3-6M',   '{"Color": "Oat", "Size": "3-6M"}',       null, 12, true,  1),
  ('ribbed-knit-romper',             'LS-ROMP-OAT-6-12', 'Oat / 6-12M',  '{"Color": "Oat", "Size": "6-12M"}',      null, 8,  false, 2),
  ('ribbed-knit-romper',             'LS-ROMP-SAG-3-6',  'Sage / 3-6M',  '{"Color": "Sage", "Size": "3-6M"}',      null, 6,  false, 3),
  ('ribbed-knit-romper',             'LS-ROMP-SAG-6-12', 'Sage / 6-12M', '{"Color": "Sage", "Size": "6-12M"}',     null, 0,  false, 4),
  ('chunky-knit-baby-cardigan',      'PC-CARD-6-12',  '6-12M',           '{"Size": "6-12M"}',                      null, 10, true,  1),
  ('chunky-knit-baby-cardigan',      'PC-CARD-12-24', '12-24M',          '{"Size": "12-24M"}',                     null, 7,  false, 2),
  ('striped-cotton-tee',             'SD-TEE-NVY-2-3', 'Navy / 2-3Y',    '{"Color": "Navy", "Size": "2-3Y"}',      null, 60, true,  1),
  ('striped-cotton-tee',             'SD-TEE-NVY-4-5', 'Navy / 4-5Y',    '{"Color": "Navy", "Size": "4-5Y"}',      14.99, 45, false, 2),
  ('striped-cotton-tee',             'SD-TEE-RED-2-3', 'Red / 2-3Y',     '{"Color": "Red", "Size": "2-3Y"}',       null, 20, false, 3),
  ('striped-cotton-tee',             'SD-TEE-RED-4-5', 'Red / 4-5Y',     '{"Color": "Red", "Size": "4-5Y"}',       14.99, 0, false, 4),
  ('dino-graphic-tee',               'WK-DINO-3-4',  '3-4Y',             '{"Size": "3-4Y"}',                       null, 18, true,  1),
  ('dino-graphic-tee',               'WK-DINO-5-6',  '5-6Y',             '{"Size": "5-6Y"}',                       null, 14, false, 2),
  ('dino-graphic-tee',               'WK-DINO-7-8',  '7-8Y',             '{"Size": "7-8Y"}',                       null, 9,  false, 3),
  ('rainbow-pullover-hoodie',        'WK-HOOD-4-5',  '4-5Y',             '{"Size": "4-5Y"}',                       null, 11, true,  1),
  ('rainbow-pullover-hoodie',        'WK-HOOD-6-7',  '6-7Y',             '{"Size": "6-7Y"}',                       null, 6,  false, 2),
  ('floral-twirl-dress',             'SD-TWIRL-PNK-3-4', 'Pink / 3-4Y',  '{"Color": "Pink", "Size": "3-4Y"}',      null, 10, true,  1),
  ('floral-twirl-dress',             'SD-TWIRL-PNK-5-6', 'Pink / 5-6Y',  '{"Color": "Pink", "Size": "5-6Y"}',      null, 7,  false, 2),
  ('floral-twirl-dress',             'SD-TWIRL-YEL-3-4', 'Yellow / 3-4Y', '{"Color": "Yellow", "Size": "3-4Y"}',   null, 5,  false, 3),
  ('denim-pinafore-dress',           'PC-PINA-2-3',  '2-3Y',             '{"Size": "2-3Y"}',                       null, 9,  true,  1),
  ('denim-pinafore-dress',           'PC-PINA-4-5',  '4-5Y',             '{"Size": "4-5Y"}',                       null, 4,  false, 2),
  ('party-tulle-dress',              'WK-TULLE-4-5', '4-5Y',             '{"Size": "4-5Y"}',                       null, 6,  true,  1),
  ('party-tulle-dress',              'WK-TULLE-6-7', '6-7Y',             '{"Size": "6-7Y"}',                       36.99, 3, false, 2),
  ('stretch-denim-jeans',            'PC-JEAN-4-5',  '4-5Y',             '{"Size": "4-5Y"}',                       null, 15, true,  1),
  ('stretch-denim-jeans',            'PC-JEAN-6-7',  '6-7Y',             '{"Size": "6-7Y"}',                       null, 12, false, 2),
  ('everyday-jogger-pants',          'SD-JOG-GRY-3-4', 'Grey / 3-4Y',    '{"Color": "Grey", "Size": "3-4Y"}',      null, 20, true,  1),
  ('everyday-jogger-pants',          'SD-JOG-NVY-3-4', 'Navy / 3-4Y',    '{"Color": "Navy", "Size": "3-4Y"}',      null, 14, false, 2),
  ('cargo-play-shorts',              'WK-CARGO-4-5', '4-5Y',             '{"Size": "4-5Y"}',                       null, 16, true,  1),
  ('puddle-rain-jacket',             'PJ-RAIN-YEL-3-4', 'Yellow / 3-4Y', '{"Color": "Yellow", "Size": "3-4Y"}',    null, 12, true,  1),
  ('puddle-rain-jacket',             'PJ-RAIN-YEL-5-6', 'Yellow / 5-6Y', '{"Color": "Yellow", "Size": "5-6Y"}',    null, 8,  false, 2),
  ('puddle-rain-jacket',             'PJ-RAIN-NVY-5-6', 'Navy / 5-6Y',   '{"Color": "Navy", "Size": "5-6Y"}',      null, 5,  false, 3),
  ('fleece-lined-winter-parka',      'PJ-PARKA-4-5', '4-5Y',             '{"Size": "4-5Y"}',                       null, 0,  true,  1),
  ('fleece-lined-winter-parka',      'PJ-PARKA-6-7', '6-7Y',             '{"Size": "6-7Y"}',                       null, 0,  false, 2),
  ('quilted-puffer-vest',            'PC-VEST-4-5',  '4-5Y',             '{"Size": "4-5Y"}',                       null, 9,  true,  1),
  ('dinosaur-pajama-set',            'LS-PJ-DINO-2-3', '2-3Y',           '{"Size": "2-3Y"}',                       null, 22, true,  1),
  ('dinosaur-pajama-set',            'LS-PJ-DINO-4-5', '4-5Y',           '{"Size": "4-5Y"}',                       null, 18, false, 2),
  ('starry-night-pajama-set',        'SD-PJ-STAR-4-5', '4-5Y',           '{"Size": "4-5Y"}',                       null, 13, true,  1),
  ('cozy-fleece-sleep-sack',         'LS-SACK-0-6',  '0-6M',             '{"Size": "0-6M"}',                       null, 10, true,  1),
  ('cozy-fleece-sleep-sack',         'LS-SACK-6-18', '6-18M',            '{"Size": "6-18M"}',                      null, 8,  false, 2),
  ('cotton-sun-hat',                 'SD-HAT',       'Default',          '{}',                                     null, 50, true,  1),
  ('rainbow-socks-5-pack',           'WK-SOCK',      'Default',          '{}',                                     null, 40, true,  1),
  ('light-up-sneakers',              'PJ-SNK-26',    'EU 26',            '{"Size": "EU 26"}',                      null, 8,  true,  1),
  ('light-up-sneakers',              'PJ-SNK-28',    'EU 28',            '{"Size": "EU 28"}',                      null, 6,  false, 2),
  ('light-up-sneakers',              'PJ-SNK-30',    'EU 30',            '{"Size": "EU 30"}',                      null, 2,  false, 3)
) as v(product_slug, sku, name, options, price, stock, is_default, sort_order)
join public.products p on p.slug = v.product_slug
on conflict (sku) do nothing;

insert into public.promotions (placement, title, subtitle, cta_label, cta_href, image_url, sort_order)
select * from (values
  ('hero',   'Made for play', 'Soft, tough clothes for climbing, splashing and everything in between.', 'Shop new arrivals', '/products',
   'https://images.unsplash.com/photo-1541580621-cb65cc53084b?auto=format&fit=crop&w=1600&h=700&q=80', 1),
  ('hero',   'Rain or shine', 'Waterproof jackets and light-up sneakers now up to 20% off.', 'Shop outerwear', '/category/outerwear',
   'https://images.unsplash.com/photo-1784541281097-113e7576b5fa?auto=format&fit=crop&w=1600&h=700&q=80', 2),
  ('banner', 'Free standard delivery over $75', 'Applied automatically at checkout.', null, null, null, 1)
) as v(placement, title, subtitle, cta_label, cta_href, image_url, sort_order)
where not exists (select 1 from public.promotions);
