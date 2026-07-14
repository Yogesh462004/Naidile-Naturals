import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null, profile: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error || !user) return { session: null, user: null, profile: null };

		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		return { session, user, profile: profile ?? null };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, profile } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.profile = profile;

	// Admin Route Protection
	if (event.url.pathname === '/admin' || event.url.pathname.startsWith('/admin/')) {
		if (!session) redirect(303, `/admin-login?next=${event.url.pathname}`);
		if (profile?.role !== 'admin') redirect(303, '/admin-login');
	}

	// Customer Only Route Protection (/cart, /checkout, /account)
	if (
		event.url.pathname.startsWith('/account') ||
		event.url.pathname.startsWith('/checkout') ||
		event.url.pathname.startsWith('/cart')
	) {
		if (!session) redirect(303, `/login?next=${event.url.pathname}`);
		if (profile?.role === 'admin') redirect(303, '/admin');
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
