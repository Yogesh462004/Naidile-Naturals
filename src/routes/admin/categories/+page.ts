import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('supabase:db:admin-categories');
	const { supabase } = await parent();
	const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
	return { categories: categories ?? [] };
};
