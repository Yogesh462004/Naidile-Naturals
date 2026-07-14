import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, parent }) => {
	const { supabase, session } = await parent();
	const orderId = url.searchParams.get('id');

	if (!orderId) {
		return { order: null, items: [] };
	}

	const [{ data: order }, { data: items }] = await Promise.all([
		supabase.from('orders').select('*').eq('id', orderId).single(),
		supabase.from('order_items').select('*').eq('order_id', orderId)
	]);

	return { order, items: items ?? [] };
};
