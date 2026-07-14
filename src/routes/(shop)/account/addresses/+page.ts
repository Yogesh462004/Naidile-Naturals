import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase, session } = await parent();
	if (!session) return { addresses: [] };

	const { data } = await supabase
		.from('addresses')
		.select('*')
		.eq('user_id', session.user.id)
		.order('is_default', { ascending: false })
		.order('created_at', { ascending: false });

	return { addresses: data ?? [] };
};
