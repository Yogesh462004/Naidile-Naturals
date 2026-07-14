import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase, session, profile } = await parent();
	const [{ data: settings }, { data: addresses }] = await Promise.all([
		supabase.from('settings').select('*').single(),
		session
			? supabase
					.from('addresses')
					.select('*')
					.eq('user_id', session.user.id)
					.order('is_default', { ascending: false })
					.order('created_at', { ascending: false })
			: Promise.resolve({ data: [] })
	]);

	return { settings, session, profile, addresses: addresses ?? [] };
};
