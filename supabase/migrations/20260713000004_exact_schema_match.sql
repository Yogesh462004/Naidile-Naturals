-- ==============================================================================
-- Migration: 20260713000004_exact_schema_match.sql
-- Purpose: Aligns exact database schema & RLS tables/columns with project requirements while maintaining full backward-compatibility triggers for existing components.
-- ==============================================================================

-- ==================== 1. profiles ====================
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;

-- Sync existing data
update public.profiles set full_name = name where full_name is null and name is not null;
update public.profiles set name = full_name where name is null and full_name is not null;

create or replace function public.sync_profiles_names()
returns trigger
language plpgsql
as $$
begin
	if new.full_name is not null and (new.name is null or new.full_name is distinct from old.full_name) then
		new.name := new.full_name;
	elsif new.name is not null and (new.full_name is null or new.name is distinct from old.name) then
		new.full_name := new.name;
	end if;
	return new;
end;
$$;

drop trigger if exists trg_sync_profiles_names on public.profiles;
create trigger trg_sync_profiles_names
before insert or update on public.profiles
for each row execute function public.sync_profiles_names();

-- Update new user trigger to also populate full_name
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, email, name, full_name, phone)
	values (
		new.id,
		new.email,
		new.raw_user_meta_data ->> 'name',
		coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
		new.raw_user_meta_data ->> 'phone'
	)
	on conflict (id) do update set
		email = excluded.email,
		name = coalesce(excluded.name, public.profiles.name),
		full_name = coalesce(excluded.full_name, public.profiles.full_name),
		phone = coalesce(excluded.phone, public.profiles.phone);
	return new;
end;
$$;


-- ==================== 2. products ====================
alter table public.products add column if not exists price numeric(10, 2) default 0 check (price >= 0);
alter table public.products add column if not exists stock integer default 0 check (stock >= 0);
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists usage text;
alter table public.products add column if not exists is_active boolean default true;

-- Backfill from existing data if available
do $$
begin
	update public.products p set
		price = coalesce((select v.price from public.product_variants v where v.product_id = p.id order by v.sort_order asc, v.price asc limit 1), 0),
		stock = coalesce((select sum(v.stock) from public.product_variants v where v.product_id = p.id), 0),
		image_url = coalesce((select i.url from public.product_images i where i.product_id = p.id order by i.sort_order asc limit 1), '/images/product-sunscreen.jpg'),
		usage = usage_instructions,
		is_active = (status <> 'hidden' and status <> 'discontinued');
end $$;

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


-- ==================== 3. carts & cart_items ====================
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

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists cart_items_product_id_idx on public.cart_items (product_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists "carts_select_own_or_admin" on public.carts;
create policy "carts_select_own_or_admin" on public.carts
	for select using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "carts_insert_own" on public.carts;
create policy "carts_insert_own" on public.carts
	for insert with check (customer_id = auth.uid());

drop policy if exists "carts_update_own" on public.carts;
create policy "carts_update_own" on public.carts
	for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());

drop policy if exists "carts_delete_own" on public.carts;
create policy "carts_delete_own" on public.carts
	for delete using (customer_id = auth.uid());

drop policy if exists "cart_items_select" on public.cart_items;
create policy "cart_items_select" on public.cart_items
	for select using (
		exists (
			select 1 from public.carts c
			where c.id = cart_id and (c.customer_id = auth.uid() or public.is_admin())
		)
	);

drop policy if exists "cart_items_insert" on public.cart_items;
create policy "cart_items_insert" on public.cart_items
	for insert with check (
		exists (
			select 1 from public.carts c
			where c.id = cart_id and c.customer_id = auth.uid()
		)
	);

drop policy if exists "cart_items_update" on public.cart_items;
create policy "cart_items_update" on public.cart_items
	for update using (
		exists (
			select 1 from public.carts c
			where c.id = cart_id and c.customer_id = auth.uid()
		)
	);

drop policy if exists "cart_items_delete" on public.cart_items;
create policy "cart_items_delete" on public.cart_items
	for delete using (
		exists (
			select 1 from public.carts c
			where c.id = cart_id and c.customer_id = auth.uid()
		)
	);


-- ==================== 4. addresses ====================
alter table public.addresses add column if not exists customer_id uuid references public.profiles (id) on delete cascade;
alter table public.addresses add column if not exists full_name text;
alter table public.addresses add column if not exists address_line1 text;
alter table public.addresses add column if not exists address_line2 text;
alter table public.addresses add column if not exists landmark text;

update public.addresses set customer_id = user_id where customer_id is null and user_id is not null;
update public.addresses set user_id = customer_id where user_id is null and customer_id is not null;
update public.addresses set full_name = name where full_name is null and name is not null;
update public.addresses set name = full_name where name is null and full_name is not null;
update public.addresses set address_line1 = address_line where address_line1 is null and address_line is not null;
update public.addresses set address_line = address_line1 where address_line is null and address_line1 is not null;

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
		new.address_line := coalesce(new.address_line1, '') || coalesce(' ' || new.address_line2, '') || coalesce(' ' || new.landmark, '');
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


-- ==================== 5. orders & order_items ====================
alter table public.orders add column if not exists customer_id uuid references public.profiles (id) on delete set null;
alter table public.orders add column if not exists total_amount numeric(10, 2) check (total_amount >= 0);

update public.orders set customer_id = user_id where customer_id is null and user_id is not null;
update public.orders set user_id = customer_id where user_id is null and customer_id is not null;
update public.orders set total_amount = total where total_amount is null and total is not null;
update public.orders set total = total_amount where total is null and total_amount is not null;

-- Expand status check constraint on orders
do $$
declare
	r record;
begin
	for r in (select constraint_name from information_schema.table_constraints where table_name = 'orders' and constraint_type = 'CHECK') loop
		execute 'alter table public.orders drop constraint if exists "' || r.constraint_name || '"';
	end loop;
end $$;

alter table public.orders add check (
	status in ('pending', 'processing', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')
);
alter table public.orders add check (total >= 0);

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


-- ==================== 6. Realtime Publications ====================
alter publication supabase_realtime add table public.carts;
alter publication supabase_realtime add table public.cart_items;
