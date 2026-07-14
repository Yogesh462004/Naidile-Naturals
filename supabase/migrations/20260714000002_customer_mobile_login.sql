-- Migration: Customer Mobile Number Login and Duplicate Prevention
-- Creates fast lookup function, duplicate verification helper, and OTP table

create table if not exists public.customer_mobile_otps (
	phone text primary key,
	otp text not null,
	email text not null,
	user_id uuid not null references auth.users(id) on delete cascade,
	created_at timestamptz not null default now(),
	expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.customer_mobile_otps enable row level security;

drop policy if exists "customer_mobile_otps_public_access" on public.customer_mobile_otps;
create policy "customer_mobile_otps_public_access" on public.customer_mobile_otps
	for all using (true) with check (true);

create index if not exists idx_profiles_phone on public.profiles(phone);

-- Security Definer helper to check if email or phone already exists in profiles (bypasses RLS for registration)
create or replace function public.check_account_duplicate(p_email text, p_phone text)
returns table (reason text, matched_value text)
language plpgsql
security definer
set search_path = public
as $$
declare
	v_clean text;
begin
	if p_email is not null and p_email <> '' then
		if exists (select 1 from public.profiles where lower(email) = lower(trim(p_email))) then
			return query select 'email'::text, p_email::text;
			return;
		end if;
	end if;

	if p_phone is not null and p_phone <> '' then
		v_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
		if length(v_clean) > 10 then
			v_clean := right(v_clean, 10);
		end if;

		if length(v_clean) >= 8 then
			if exists (
				select 1 from public.profiles
				where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') like '%' || v_clean || '%'
			) then
				return query select 'phone'::text, p_phone::text;
				return;
			end if;
		end if;
	end if;
end;
$$;

-- Security Definer helper to lookup a customer profile by their mobile number safely
create or replace function public.get_customer_by_phone(p_phone text)
returns table (id uuid, email text, name text, phone text)
language plpgsql
security definer
set search_path = public
as $$
declare
	v_clean text;
begin
	v_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
	if length(v_clean) > 10 then
		v_clean := right(v_clean, 10);
	end if;

	if length(v_clean) < 8 then
		return;
	end if;

	return query
	select p.id, p.email, p.name, p.phone
	from public.profiles p
	where p.role = 'customer'
	  and (
	      regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') like '%' || v_clean || '%'
	  )
	limit 1;
end;
$$;

grant execute on function public.check_account_duplicate(text, text) to anon, authenticated, service_role;
grant execute on function public.get_customer_by_phone(text) to anon, authenticated, service_role;
