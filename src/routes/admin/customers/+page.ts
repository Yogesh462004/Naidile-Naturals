import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();

	const [{ data: customers }, { data: orders }] = await Promise.all([
		supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
		supabase.from('orders').select('user_id, customer_id, total, total_amount')
	]);

	// Calculate number of orders and phone per customer if available
	const customerStats = (customers ?? []).map((customer) => {
		const custOrders = (orders ?? []).filter((o) => o.user_id === customer.id || o.customer_id === customer.id);
		return {
			...customer,
			orderCount: custOrders.length,
			totalSpent: custOrders.reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0)
		};
	});

	return {
		customers: customerStats
	};
};
