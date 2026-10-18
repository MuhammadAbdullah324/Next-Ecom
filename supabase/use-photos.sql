-- Tiny Threads: one-time switch to the Unsplash product photos for a database seeded earlier.
-- Replaces placeholder and drawing URLs only (placehold.co or /images/...); photos you uploaded yourself are kept.

begin;

update public.product_images i
set url = v.url
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
where i.product_id = p.id and i.sort_order = v.n
  and (i.url like 'https://placehold.co/%' or i.url like '/images/%');

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
where c.slug = v.slug and (c.image_url is null or c.image_url like 'https://placehold.co/%' or c.image_url like '/images/%');

update public.promotions
set image_url = case title when 'Made for play' then 'https://images.unsplash.com/photo-1541580621-cb65cc53084b?auto=format&fit=crop&w=1600&h=700&q=80' else 'https://images.unsplash.com/photo-1784541281097-113e7576b5fa?auto=format&fit=crop&w=1600&h=700&q=80' end
where placement = 'hero' and (image_url like 'https://placehold.co/%' or image_url like '/images/%');

commit;
