-- Naidile Naturals — core schema, indexes, RLS

create extension if not exists "pgcrypto";

-- ============ profiles ============
create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	email text not null,
	name text,
	role text not null default 'customer' check (role in ('customer', 'admin')),
	created_at timestamptz not null default now()
);

-- security-definer helper so RLS policies can check role without recursing on profiles
create function public.is_admin()
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

-- auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, email, name)
	values (new.id, new.email, new.raw_user_meta_data ->> 'name');
	return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ categories ============
create table public.categories (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	subtitle text,
	icon text,
	sort_order int not null default 0,
	created_at timestamptz not null default now()
);

-- ============ products ============
create table public.products (
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
	status text not null default 'available'
		check (status in ('available', 'out_of_stock', 'coming_soon', 'hidden', 'discontinued')),
	sort_order int not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_status_idx on public.products (status);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ============ product_images ============
create table public.product_images (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references public.products (id) on delete cascade,
	url text not null,
	sort_order int not null default 0
);

create index product_images_product_id_idx on public.product_images (product_id);

-- ============ product_variants (size/price/stock) ============
create table public.product_variants (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references public.products (id) on delete cascade,
	size text not null,
	price numeric(10, 2) not null check (price >= 0),
	stock int not null default 0 check (stock >= 0),
	sort_order int not null default 0
);

create index product_variants_product_id_idx on public.product_variants (product_id);

-- ============ orders ============
create table public.orders (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references public.profiles (id) on delete set null,
	customer_name text not null,
	customer_phone text not null,
	customer_address text not null,
	notes text,
	status text not null default 'pending'
		check (status in ('pending', 'confirmed', 'packed', 'delivered', 'cancelled')),
	total numeric(10, 2) not null check (total >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ============ order_items ============
create table public.order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references public.orders (id) on delete cascade,
	product_id uuid references public.products (id) on delete set null,
	product_name text not null,
	variant_size text,
	price numeric(10, 2) not null check (price >= 0),
	qty int not null check (qty > 0)
);

create index order_items_order_id_idx on public.order_items (order_id);

-- ============ settings (singleton row) ============
create table public.settings (
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

create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- ============ banners ============
create table public.banners (
	id uuid primary key default gen_random_uuid(),
	title text,
	subtitle text,
	image_url text,
	link_url text,
	active boolean not null default true,
	sort_order int not null default 0,
	created_at timestamptz not null default now()
);

-- ================= RLS =================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.banners enable row level security;

-- profiles: own row + admin sees all
create policy "profiles_select_own_or_admin" on public.profiles
	for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
	for update using (id = auth.uid()) with check (id = auth.uid());

-- categories: public read, admin write
create policy "categories_public_select" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories for insert with check (public.is_admin());
create policy "categories_admin_update" on public.categories for update using (public.is_admin());
create policy "categories_admin_delete" on public.categories for delete using (public.is_admin());

-- products: public sees everything except hidden, admin sees/writes all
create policy "products_public_select" on public.products
	for select using (status <> 'hidden' or public.is_admin());
create policy "products_admin_write" on public.products for insert with check (public.is_admin());
create policy "products_admin_update" on public.products for update using (public.is_admin());
create policy "products_admin_delete" on public.products for delete using (public.is_admin());

-- product_images / product_variants: follow parent product visibility
create policy "product_images_select" on public.product_images
	for select using (
		exists (
			select 1 from public.products p
			where p.id = product_id and (p.status <> 'hidden' or public.is_admin())
		)
	);
create policy "product_images_admin_write" on public.product_images for insert with check (public.is_admin());
create policy "product_images_admin_update" on public.product_images for update using (public.is_admin());
create policy "product_images_admin_delete" on public.product_images for delete using (public.is_admin());

create policy "product_variants_select" on public.product_variants
	for select using (
		exists (
			select 1 from public.products p
			where p.id = product_id and (p.status <> 'hidden' or public.is_admin())
		)
	);
create policy "product_variants_admin_write" on public.product_variants for insert with check (public.is_admin());
create policy "product_variants_admin_update" on public.product_variants for update using (public.is_admin());
create policy "product_variants_admin_delete" on public.product_variants for delete using (public.is_admin());

-- orders: customers see their own, anyone (incl. guests) can place one, admin sees/updates all
create policy "orders_select_own_or_admin" on public.orders
	for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_insert_anyone" on public.orders
	for insert with check (user_id = auth.uid() or user_id is null);
create policy "orders_admin_update" on public.orders for update using (public.is_admin());

-- order_items: visible if parent order is visible; insertable alongside order creation
-- ponytail: no per-item ownership check beyond the order's own insert policy — fine for a
-- no-payment WhatsApp order flow; add an order-creation token if this ever needs hardening.
create policy "order_items_select" on public.order_items
	for select using (
		exists (
			select 1 from public.orders o
			where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
		)
	);
create policy "order_items_insert" on public.order_items
	for insert with check (exists (select 1 from public.orders o where o.id = order_id));
create policy "order_items_admin_update" on public.order_items for update using (public.is_admin());

-- settings: public read, admin write
create policy "settings_public_select" on public.settings for select using (true);
create policy "settings_admin_update" on public.settings for update using (public.is_admin());

-- banners: public reads active ones (admin sees all), admin writes
create policy "banners_public_select" on public.banners
	for select using (active or public.is_admin());
create policy "banners_admin_write" on public.banners for insert with check (public.is_admin());
create policy "banners_admin_update" on public.banners for update using (public.is_admin());
create policy "banners_admin_delete" on public.banners for delete using (public.is_admin());

-- ================= Storage =================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_bucket_public_read" on storage.objects
	for select using (bucket_id = 'product-images');
create policy "product_images_bucket_admin_insert" on storage.objects
	for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_update" on storage.objects
	for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product_images_bucket_admin_delete" on storage.objects
	for delete using (bucket_id = 'product-images' and public.is_admin());

-- ================= Realtime =================
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.product_variants;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.banners;
