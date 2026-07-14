-- Migration for saved addresses (Like Flipkart/Amazon) and order enhancements

-- ============ addresses ============
create table if not exists public.addresses (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	label text not null default 'Home',
	name text not null,
	phone text not null,
	address_line text not null,
	city text,
	state text,
	pincode text,
	is_default boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);
create index if not exists addresses_is_default_idx on public.addresses (is_default);

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

-- Function and trigger to ensure only one default address per user
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
		where user_id = new.user_id and id <> new.id and is_default = true;
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

-- ================= RLS for addresses =================
alter table public.addresses enable row level security;

drop policy if exists "addresses_select_own_or_admin" on public.addresses;
create policy "addresses_select_own_or_admin" on public.addresses
	for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses
	for insert with check (user_id = auth.uid());

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses
	for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses
	for delete using (user_id = auth.uid());

-- Add address_id reference to orders table if needed for tracking chosen address
do $$
begin
	if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'address_id') then
		alter table public.orders add column address_id uuid references public.addresses (id) on delete set null;
	end if;
end $$;

-- Add realtime publication for addresses if needed
alter publication supabase_realtime add table public.addresses;
