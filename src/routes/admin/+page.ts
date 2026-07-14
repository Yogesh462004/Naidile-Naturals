import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('supabase:db:admin-dashboard');
	const { supabase } = await parent();

	const [
		{ count: productCount, error: prodErr },
		{ count: orderCount, error: ordErr },
		{ count: customerCount },
		{ data: allOrders, error: ordersErr },
		{ data: lowStockProducts },
		{ data: outOfStockProducts }
	] = await Promise.all([
		supabase.from('products').select('*', { count: 'exact', head: true }),
		supabase.from('orders').select('*', { count: 'exact', head: true }),
		supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
		supabase.from('orders').select('id, total, total_amount, created_at, customer_name, status, notes').order('created_at', { ascending: false }),
		supabase.from('products').select('id, name, stock, price, status, image_url').lt('stock', 5).gt('stock', 0),
		supabase.from('products').select('id, name, stock, price, status, image_url').lte('stock', 0)
	]);

	if (prodErr || ordErr || ordersErr) {
		return {
			error: true,
			errorMessage: 'Unable to fetch dashboard.',
			productCount: 0,
			orderCount: 0,
			customerCount: 0,
			todaysOrdersCount: 0,
			todaysOrders: [],
			totalRevenue: 0,
			recentOrders: [],
			lowStockProducts: [],
			outOfStockProducts: []
		};
	}

	// Dynamic Revenue Calculation: Strictly exclude any order where status is Cancelled
	const activeOrders = (allOrders ?? []).filter(
		(o) => o.status?.toLowerCase() !== 'cancelled' && o.status?.toLowerCase() !== 'canceled'
	);
	const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total || o.total_amount || 0), 0);

	const today = new Date().toISOString().split('T')[0];
	const todaysOrders = (allOrders ?? []).filter((o) => o.created_at.startsWith(today));

	return {
		error: false,
		errorMessage: null,
		productCount: productCount ?? 0,
		orderCount: orderCount ?? 0,
		customerCount: customerCount ?? 0,
		todaysOrdersCount: todaysOrders.length,
		todaysOrders,
		totalRevenue,
		recentOrders: (allOrders ?? []).slice(0, 8),
		lowStockProducts: lowStockProducts ?? [],
		outOfStockProducts: outOfStockProducts ?? []
	};
};
