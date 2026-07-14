-- pin search_path on set_updated_at (was mutable)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

-- handle_new_user only needs to run via the auth.users trigger, never direct RPC
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- bucket is already public: true, so object URLs are servable without a SELECT policy;
-- dropping it removes the ability to LIST all files while public getPublicUrl() still works
drop policy if exists "product_images_bucket_public_read" on storage.objects;
