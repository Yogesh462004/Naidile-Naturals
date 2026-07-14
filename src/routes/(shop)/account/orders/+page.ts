import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();

	const { data: orders } = await supabase
		.from('orders')
		.select('*, order_items(*)')
		.order('created_at', { ascending: false });

	return { orders: orders ?? [] };
};
