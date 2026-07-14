import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();

	const [{ data: orders }, { data: products }, { data: profiles }] = await Promise.all([
		supabase.from('orders').select('*').order('created_at', { ascending: true }),
		supabase.from('products').select('*'),
		supabase.from('profiles').select('*').eq('role', 'customer')
	]);

	const allOrders = orders ?? [];
	const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
	const totalOrders = allOrders.length;
	const totalCustomers = (profiles ?? []).length;
	const totalProducts = (products ?? []).length;

	// Calculate today's orders
	const today = new Date().toISOString().split('T')[0];
	const todaysOrders = allOrders.filter((o) => o.created_at.startsWith(today));
	const todaysRevenue = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

	// Order status breakdowns
	const statusBreakdown = {
		pending: allOrders.filter((o) => o.status === 'pending').length,
		confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
		packed: allOrders.filter((o) => o.status === 'packed').length,
		delivered: allOrders.filter((o) => o.status === 'delivered').length,
		cancelled: allOrders.filter((o) => o.status === 'cancelled').length
	};

	return {
		totalRevenue,
		totalOrders,
		totalCustomers,
		totalProducts,
		todaysOrdersCount: todaysOrders.length,
		todaysRevenue,
		statusBreakdown
	};
};
