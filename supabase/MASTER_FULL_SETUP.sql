-- ==============================================================================
-- MASTER ALL-IN-ONE NAIDILE NATURALS SCHEMA, TRIGGERS, RLS & SEED DATA
-- Purpose: Run this single file in Supabase SQL Editor to set up EVERYTHING cleanly.
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ==================== 1. PROFILES ====================
create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	email text not null,
	name text,
	full_name text,
	phone text,
	role text not null default 'customer' check (role in ('customer', 'admin')),
	created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists mobile_number text;

update public.profiles set full_name = name where full_name is null and name is not null;
update public.profiles set name = full_name where name is null and full_name is not null;
update public.profiles set mobile_number = phone where mobile_number is null and phone is not null;
update public.profiles set phone = mobile_number where phone is null and mobile_number is not null;

create or replace function public.sync_profiles_fields()
returns trigger
language plpgsql
as $$
begin
	if new.full_name is not null and (new.name is null or new.full_name is distinct from old.full_name) then
		new.name := new.full_name;
	elsif new.name is not null and (new.full_name is null or new.name is distinct from old.name) then
		new.full_name := new.name;
	end if;

	if new.mobile_number is not null and (new.phone is null or new.mobile_number is distinct from old.mobile_number) then
		new.phone := new.mobile_number;
	elsif new.phone is not null and (new.mobile_number is null or new.phone is distinct from old.phone) then
		new.mobile_number := new.phone;
	end if;

	if new.role is null then
		new.role := 'customer';
	end if;

	return new;
end;
$$;

drop trigger if exists trg_sync_profiles_fields on public.profiles;
create trigger trg_sync_profiles_fields
before insert or update on public.profiles
for each row execute function public.sync_profiles_fields();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
	select exists (
		select 1 from public.profiles where id = auth.uid() and role = 'admin'
	);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, email, name, full_name, phone, mobile_number, role)
	values (
		new.id,
		new.email,
		new.raw_user_meta_data ->> 'name',
		coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
		coalesce(new.raw_user_meta_data ->> 'phone', new.raw_user_meta_data ->> 'mobile_number'),
		coalesce(new.raw_user_meta_data ->> 'mobile_number', new.raw_user_meta_data ->> 'phone'),
		coalesce(new.raw_user_meta_data ->> 'role', 'customer')
	)
	on conflict (id) do update set
		email = excluded.email,
		name = coalesce(excluded.name, public.profiles.name),
		full_name = coalesce(excluded.full_name, public.profiles.full_name),
		phone = coalesce(excluded.phone, public.profiles.phone),
		mobile_number = coalesce(excluded.mobile_number, public.profiles.mobile_number),
		role = coalesce(excluded.role, public.profiles.role);
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ==================== 2. CATEGORIES ====================
create table if not exists public.categories (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	subtitle text,
	icon text,
	sort_order int not null default 0,
	created_at timestamptz not null default now()
);


-- ==================== 3. PRODUCTS ====================
create table if not exists public.products (
	id uuid primary key default gen_random_uuid(),
	category_id uuid not null references public.categories (id) on delete restrict,
	slug text not null unique,
	name text not null,
	eyebrow text,
	description text,
	care_note text,
	ingredients text,
	benefits text,
	usage_instructions text,
	usage text,
	status text not null default 'available'
		check (status in ('available', 'out_of_stock', 'coming_soon', 'hidden', 'discontinued')),
	is_active boolean default true,
	price numeric(10, 2) default 0 check (price >= 0),
	stock integer default 0 check (stock >= 0),
	image_url text,
	sort_order int not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.products add column if not exists price numeric(10, 2) default 0 check (price >= 0);
alter table public.products add column if not exists stock integer default 0 check (stock >= 0);
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists usage text;
alter table public.products add column if not exists is_active boolean default true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.sync_products_fields()
returns trigger
language plpgsql
as $$
begin
	if new.usage is not null and (new.usage_instructions is null or new.usage is distinct from old.usage) then
		new.usage_instructions := new.usage;
	elsif new.usage_instructions is not null and (new.usage is null or new.usage_instructions is distinct from old.usage_instructions) then
		new.usage := new.usage_instructions;
	end if;

	if new.is_active is not null and (new.status is null or new.is_active is distinct from old.is_active) then
		if new.is_active = true then
			if new.status = 'hidden' then new.status := 'available'; end if;
		else
			new.status := 'hidden';
		end if;
	elsif new.status is not null and (new.is_active is null or new.status is distinct from old.status) then
		new.is_active := (new.status <> 'hidden' and new.status <> 'discontinued');
	end if;

	return new;
end;
$$;

drop trigger if exists trg_sync_products_fields on public.products;
create trigger trg_sync_products_fields
before insert or update on public.products
for each row execute function public.sync_products_fields();


-- ==================== 4. PRODUCT VARIANTS & IMAGES ====================
create table if not exists public.product_variants (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references public.products (id) on delete cascade,
	size text not null,
	price numeric(10, 2) not null check (price >= 0),
	stock int not null default 0 check (stock >= 0),
	sort_order int not null default 0
);

create table if not exists public.product_images (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references public.products (id) on delete cascade,
	url text not null,
	sort_order int not null default 0
);


-- ==================== 5. CARTS & CART ITEMS ====================
create table if not exists public.carts (
	id uuid primary key default gen_random_uuid(),
	customer_id uuid not null references public.profiles (id) on delete cascade unique,
	created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
	id uuid primary key default gen_random_uuid(),
	cart_id uuid not null references public.carts (id) on delete cascade,
	product_id uuid not null references public.products (id) on delete cascade,
	quantity int not null check (quantity > 0),
	unique (cart_id, product_id)
);


-- ==================== 6. ADDRESSES ====================
create table if not exists public.addresses (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references public.profiles (id) on delete cascade,
	customer_id uuid references public.profiles (id) on delete cascade,
	label text not null default 'Home',
	name text not null default '',
	full_name text,
	phone text not null default '',
	address_line text not null default '',
	address_line1 text,
	address_line2 text,
	landmark text,
	city text,
	state text default 'Karnataka',
	pincode text,
	is_default boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.addresses add column if not exists customer_id uuid references public.profiles (id) on delete cascade;
alter table public.addresses add column if not exists full_name text;
alter table public.addresses add column if not exists address_line1 text;
alter table public.addresses add column if not exists address_line2 text;
alter table public.addresses add column if not exists landmark text;
alter table public.addresses add column if not exists state text default 'Karnataka';

update public.addresses set customer_id = user_id where customer_id is null and user_id is not null;
update public.addresses set user_id = customer_id where user_id is null and customer_id is not null;
update public.addresses set full_name = name where full_name is null and name is not null;
update public.addresses set name = full_name where name is null and full_name is not null;
update public.addresses set address_line1 = address_line where address_line1 is null and address_line is not null;
update public.addresses set address_line = coalesce(address_line1, address_line, '') where address_line is null;

create or replace function public.sync_addresses_fields()
returns trigger
language plpgsql
as $$
begin
	if new.customer_id is not null and (new.user_id is null or new.customer_id is distinct from old.customer_id) then
		new.user_id := new.customer_id;
	elsif new.user_id is not null and (new.customer_id is null or new.user_id is distinct from old.user_id) then
		new.customer_id := new.user_id;
	end if;

	if new.full_name is not null and (new.name is null or new.full_name is distinct from old.full_name) then
		new.name := new.full_name;
	elsif new.name is not null and (new.full_name is null or new.name is distinct from old.name) then
		new.full_name := new.name;
	end if;

	if new.address_line1 is not null and (new.address_line is null or new.address_line1 is distinct from old.address_line1) then
		new.address_line := concat_ws(', ', nullif(new.address_line1, ''), nullif(new.address_line2, ''), case when new.landmark is not null and new.landmark <> '' then 'Near ' || new.landmark else null end, nullif(new.city, ''), nullif(new.state, ''), case when new.pincode is not null and new.pincode <> '' then 'PIN: ' || new.pincode else null end);
	elsif new.address_line is not null and (new.address_line1 is null or new.address_line is distinct from old.address_line) then
		new.address_line1 := new.address_line;
	end if;

	return new;
end;
$$;

drop trigger if exists trg_sync_addresses_fields on public.addresses;
create trigger trg_sync_addresses_fields
before insert or update on public.addresses
for each row execute function public.sync_addresses_fields();

create or replace function public.ensure_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.is_default = true then
		update public.addresses
		set is_default = false
		where coalesce(user_id, customer_id) = coalesce(new.user_id, new.customer_id)
		  and id <> new.id
		  and is_default = true;
	end if;
	return new;
end;
$$;

drop trigger if exists on_address_default_changed on public.addresses;
create trigger on_address_default_changed
after insert or update of is_default on public.addresses
for each row
when (new.is_default = true)
execute function public.ensure_single_default_address();


-- ==================== 7. ORDERS & ORDER ITEMS ====================
create table if not exists public.orders (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references public.profiles (id) on delete set null,
	customer_id uuid references public.profiles (id) on delete set null,
	customer_name text not null default '',
	customer_phone text not null default '',
	customer_address text not null default '',
	notes text,
	status text not null default 'pending',
	total numeric(10, 2) not null default 0 check (total >= 0),
	total_amount numeric(10, 2) check (total_amount >= 0),
	address_id uuid references public.addresses (id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid references public.profiles (id) on delete set null;
alter table public.orders add column if not exists total_amount numeric(10, 2) check (total_amount >= 0);
alter table public.orders add column if not exists address_id uuid references public.addresses (id) on delete set null;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
	check (status in ('pending', 'processing', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'));

update public.orders set customer_id = user_id where customer_id is null and user_id is not null;
update public.orders set user_id = customer_id where user_id is null and customer_id is not null;
update public.orders set total_amount = total where total_amount is null and total is not null;
update public.orders set total = total_amount where total is null and total_amount is not null;

create or replace function public.sync_orders_fields()
returns trigger
language plpgsql
as $$
begin
	if new.customer_id is not null and (new.user_id is null or new.customer_id is distinct from old.customer_id) then
		new.user_id := new.customer_id;
	elsif new.user_id is not null and (new.customer_id is null or new.user_id is distinct from old.user_id) then
		new.customer_id := new.user_id;
	end if;

	if new.total_amount is not null and (new.total is null or new.total_amount is distinct from old.total_amount) then
		new.total := new.total_amount;
	elsif new.total is not null and (new.total_amount is null or new.total is distinct from old.total) then
		new.total_amount := new.total;
	end if;

	return new;
end;
$$;

drop trigger if exists trg_sync_orders_fields on public.orders;
create trigger trg_sync_orders_fields
before insert or update on public.orders
for each row execute function public.sync_orders_fields();

create table if not exists public.order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references public.orders (id) on delete cascade,
	product_id uuid references public.products (id) on delete set null,
	product_name text not null,
	variant_size text,
	price numeric(10, 2) not null check (price >= 0),
	quantity int check (quantity > 0),
	qty int check (qty > 0)
);

alter table public.order_items add column if not exists quantity int check (quantity > 0);
update public.order_items set quantity = qty where quantity is null and qty is not null;
update public.order_items set qty = quantity where qty is null and quantity is not null;

create or replace function public.sync_order_items_fields()
returns trigger
language plpgsql
as $$
begin
	if new.quantity is not null and (new.qty is null or new.quantity is distinct from old.quantity) then
		new.qty := new.quantity;
	elsif new.qty is not null and (new.quantity is null or new.qty is distinct from old.qty) then
		new.quantity := new.qty;
	end if;
	return new;
end;
$$;

drop trigger if exists trg_sync_order_items_fields on public.order_items;
create trigger trg_sync_order_items_fields
before insert or update on public.order_items
for each row execute function public.sync_order_items_fields();


-- ==================== 8. SETTINGS & BANNERS ====================
create table if not exists public.settings (
	id boolean primary key default true check (id),
	business_phone text,
	whatsapp_number text,
	business_address text,
	business_email text,
	instagram_url text,
	whatsapp_channel_url text,
	footer_text text,
	updated_at timestamptz not null default now()
);

create table if not exists public.banners (
	id uuid primary key default gen_random_uuid(),
	title text,
	subtitle text,
	image_url text,
	link_url text,
	active boolean not null default true,
	sort_order int not null default 0,
	created_at timestamptz not null default now()
);


-- ==================== 9. ROW LEVEL SECURITY (RLS) ====================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.banners enable row level security;

-- PROFILES POLICIES
drop policy if exists "profiles_read_own_or_admin" on public.profiles;
create policy "profiles_read_own_or_admin" on public.profiles
	for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
	for update using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
	for all using (public.is_admin());

-- CATEGORIES POLICIES
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
	for select using (true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
	for all using (public.is_admin());

-- PRODUCTS POLICIES
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
	for select using (is_active = true or status = 'available' or status = 'out_of_stock' or status = 'coming_soon' or public.is_admin());

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
	for all using (public.is_admin());

-- VARIANTS & IMAGES POLICIES
drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants
	for select using (
		exists (select 1 from public.products p where p.id = product_id and (p.is_active = true or p.status <> 'hidden' or public.is_admin()))
	);

drop policy if exists "variants_admin_all" on public.product_variants;
create policy "variants_admin_all" on public.product_variants
	for all using (public.is_admin());

drop policy if exists "images_public_read" on public.product_images;
create policy "images_public_read" on public.product_images
	for select using (
		exists (select 1 from public.products p where p.id = product_id and (p.is_active = true or p.status <> 'hidden' or public.is_admin()))
	);

drop policy if exists "images_admin_all" on public.product_images;
create policy "images_admin_all" on public.product_images
	for all using (public.is_admin());

-- CARTS & CART ITEMS POLICIES
drop policy if exists "carts_select_own_or_admin" on public.carts;
create policy "carts_select_own_or_admin" on public.carts
	for select using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "carts_insert_own" on public.carts;
create policy "carts_insert_own" on public.carts
	for insert with check (customer_id = auth.uid());

drop policy if exists "carts_update_own" on public.carts;
create policy "carts_update_own" on public.carts
	for update using (customer_id = auth.uid() or public.is_admin()) with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists "carts_delete_own" on public.carts;
create policy "carts_delete_own" on public.carts
	for delete using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "cart_items_select" on public.cart_items;
create policy "cart_items_select" on public.cart_items
	for select using (
		exists (select 1 from public.carts c where c.id = cart_id and (c.customer_id = auth.uid() or public.is_admin()))
	);

drop policy if exists "cart_items_insert" on public.cart_items;
create policy "cart_items_insert" on public.cart_items
	for insert with check (
		exists (select 1 from public.carts c where c.id = cart_id and (c.customer_id = auth.uid() or public.is_admin()))
	);

drop policy if exists "cart_items_update" on public.cart_items;
create policy "cart_items_update" on public.cart_items
	for update using (
		exists (select 1 from public.carts c where c.id = cart_id and (c.customer_id = auth.uid() or public.is_admin()))
	);

drop policy if exists "cart_items_delete" on public.cart_items;
create policy "cart_items_delete" on public.cart_items
	for delete using (
		exists (select 1 from public.carts c where c.id = cart_id and (c.customer_id = auth.uid() or public.is_admin()))
	);

-- ADDRESSES POLICIES
drop policy if exists "addresses_select_own_or_admin" on public.addresses;
create policy "addresses_select_own_or_admin" on public.addresses
	for select using (coalesce(customer_id, user_id) = auth.uid() or public.is_admin());

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses
	for insert with check (coalesce(customer_id, user_id) = auth.uid() or public.is_admin());

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses
	for update using (coalesce(customer_id, user_id) = auth.uid() or public.is_admin())
	with check (coalesce(customer_id, user_id) = auth.uid() or public.is_admin());

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses
	for delete using (coalesce(customer_id, user_id) = auth.uid() or public.is_admin());

-- ORDERS POLICIES
drop policy if exists "orders_read_own_or_admin" on public.orders;
create policy "orders_read_own_or_admin" on public.orders
	for select using (coalesce(customer_id, user_id) = auth.uid() or public.is_admin());

drop policy if exists "orders_create_own" on public.orders;
create policy "orders_create_own" on public.orders
	for insert with check (coalesce(customer_id, user_id) = auth.uid() or coalesce(customer_id, user_id) is null);

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
	for all using (public.is_admin());

drop policy if exists "order_items_read_own_or_admin" on public.order_items;
create policy "order_items_read_own_or_admin" on public.order_items
	for select using (
		exists (select 1 from public.orders o where o.id = order_id and (coalesce(o.customer_id, o.user_id) = auth.uid() or public.is_admin()))
	);

drop policy if exists "order_items_create_own" on public.order_items;
create policy "order_items_create_own" on public.order_items
	for insert with check (
		exists (select 1 from public.orders o where o.id = order_id and (coalesce(o.customer_id, o.user_id) = auth.uid() or coalesce(o.customer_id, o.user_id) is null))
	);

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all" on public.order_items
	for all using (public.is_admin());

-- SETTINGS & BANNERS POLICIES
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
	for select using (true);

drop policy if exists "settings_admin_all" on public.settings;
create policy "settings_admin_all" on public.settings
	for all using (public.is_admin());

drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners
	for select using (active = true or public.is_admin());

drop policy if exists "banners_admin_all" on public.banners;
create policy "banners_admin_all" on public.banners
	for all using (public.is_admin());


-- ==================== 10. SEED DATA ====================
insert into public.categories (slug, name, subtitle, icon, sort_order) values
	('skincare', 'Skin Care', 'Pure botanicals for everyday protection & nourishment.', '🌸', 1),
	('haircare', 'Hair Care', 'Botanical oils and herbal blends for strong, healthy hair.', '🌿', 2),
	('cleansers', 'Cleansers', 'Gentle, toxin-free cleansing for face and body.', '💧', 3),
	('purepowders', 'Pure Powders', 'Herbal & botanical powders, ground pure and simple.', '🌾', 4)
on conflict (slug) do update set
	name = excluded.name,
	subtitle = excluded.subtitle,
	icon = excluded.icon,
	sort_order = excluded.sort_order;

with sunscreen as (
	insert into public.products (
		category_id, slug, name, eyebrow, description, care_note, status, is_active, sort_order
	)
	select
		id,
		'natural-sun-screen',
		'Natural Sun Screen',
		'Skin Care · SPF 20+',
		'SPF 20+. Apply while going out, once or twice per day. Made with pure, whole-plant ingredients — free from synthetic chemicals and harsh preservatives.',
		'Keep in refrigerator. Store chilled for freshness — this is a preservative-free, small-batch formulation.',
		'available',
		true,
		1
	from public.categories where slug = 'skincare'
	on conflict (slug) do update set
		name = excluded.name,
		eyebrow = excluded.eyebrow,
		description = excluded.description,
		care_note = excluded.care_note,
		status = excluded.status,
		is_active = excluded.is_active
	returning id
)
insert into public.product_variants (product_id, size, price, stock, sort_order)
select id, '50ml', 170, 50, 1 from sunscreen
where not exists (select 1 from public.product_variants where product_id = sunscreen.id and size = '50ml')
union all
select id, '100ml', 195, 50, 2 from sunscreen
where not exists (select 1 from public.product_variants where product_id = sunscreen.id and size = '100ml')
union all
select id, '200ml', 260, 50, 3 from sunscreen
where not exists (select 1 from public.product_variants where product_id = sunscreen.id and size = '200ml');

insert into public.product_images (product_id, url, sort_order)
select p.id, '/images/product-sunscreen.jpg', 1
from public.products p
where p.slug = 'natural-sun-screen'
  and not exists (select 1 from public.product_images where product_id = p.id and url = '/images/product-sunscreen.jpg');

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
on conflict (id) do update set
	business_phone = excluded.business_phone,
	whatsapp_number = excluded.whatsapp_number,
	instagram_url = excluded.instagram_url,
	whatsapp_channel_url = excluded.whatsapp_channel_url,
	footer_text = excluded.footer_text;
