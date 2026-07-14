-- Seed data migrated verbatim from the original static site.

insert into public.categories (slug, name, subtitle, icon, sort_order) values
	('skincare', 'Skin Care', 'Pure botanicals for everyday protection & nourishment.', '🌸', 1),
	('haircare', 'Hair Care', 'Botanical oils and herbal blends for strong, healthy hair.', '🌿', 2),
	('cleansers', 'Cleansers', 'Gentle, toxin-free cleansing for face and body.', '💧', 3),
	('purepowders', 'Pure Powders', 'Herbal & botanical powders, ground pure and simple.', '🌾', 4);

with sunscreen as (
	insert into public.products (
		category_id, slug, name, eyebrow, description, care_note, status, sort_order
	)
	select
		id,
		'natural-sun-screen',
		'Natural Sun Screen',
		'Skin Care · SPF 20+',
		'SPF 20+. Apply while going out, once or twice per day. Made with pure, whole-plant ingredients — free from synthetic chemicals and harsh preservatives.',
		'Keep in refrigerator. Store chilled for freshness — this is a preservative-free, small-batch formulation.',
		'available',
		1
	from public.categories where slug = 'skincare'
	returning id
)
insert into public.product_variants (product_id, size, price, stock, sort_order)
select id, '50ml', 170, 50, 1 from sunscreen
union all
select id, '100ml', 195, 50, 2 from sunscreen
union all
select id, '200ml', 260, 50, 3 from sunscreen;

insert into public.product_images (product_id, url, sort_order)
select id, '/images/product-sunscreen.jpg', 1
from public.products where slug = 'natural-sun-screen';

insert into public.settings (
	id, business_phone, whatsapp_number, business_address, business_email,
	instagram_url, whatsapp_channel_url, footer_text
) values (
	true,
	'+919019816447',
	'+919019816447',
	null,
	null,
	'https://www.instagram.com/p/DYeOL2eMMSO/?igsh=MWh6OHBqcW81OGlqZQ==',
	'https://whatsapp.com/channel/0029VbCoQpVLSmbi024cwW1N',
	'Naidile Naturals — We CARE for HEALTHY skin & hair'
)
on conflict (id) do nothing;
