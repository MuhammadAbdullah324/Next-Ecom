-- Tiny Threads: one-time switch from placehold.co placeholders to the drawings in public/images.
-- Only rows that still point at placehold.co change, so real photos you have added are kept.

begin;

update public.product_images i
set url = '/images/products/' || p.slug || '-' || i.sort_order || '.jpg'
from public.products p
where p.id = i.product_id and i.url like 'https://placehold.co/%';

update public.categories
set image_url = '/images/categories/' || slug || '.jpg'
where image_url like 'https://placehold.co/%' or image_url is null;

update public.promotions
set image_url = case title when 'Made for play' then '/images/banners/made-for-play.jpg' else '/images/banners/rain-or-shine.jpg' end
where image_url like 'https://placehold.co/%';

commit;
