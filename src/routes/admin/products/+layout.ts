import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { supabase } = await parent();
	const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
	return { categories: categories ?? [] };
};
