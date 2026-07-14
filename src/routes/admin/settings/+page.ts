import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();
	const { data: settings } = await supabase.from('settings').select('*').single();
	return { settings };
};
