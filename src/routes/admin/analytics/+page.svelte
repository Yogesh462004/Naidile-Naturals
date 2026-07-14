<script lang="ts">
	import { formatPrice } from '$lib/utils/format';

	let { data } = $props();
</script>

<svelte:head>
	<title>Analytics — Admin Dashboard</title>
</svelte:head>

<h1 class="serif text-2xl font-medium text-ink">E-Commerce Analytics &amp; Reports</h1>
<p class="text-xs text-muted">Real-time performance overview powered by Supabase</p>

<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	<div class="rounded-[24px] border border-line bg-white p-6 shadow-card">
		<div class="text-xs font-medium uppercase tracking-wider text-muted">Total Gross Revenue</div>
		<div class="serif mt-2 text-3xl font-medium text-terracotta">{formatPrice(data.totalRevenue)}</div>
		<div class="mt-1 text-xs text-muted">All-time recorded sales</div>
	</div>

	<div class="rounded-[24px] border border-line bg-white p-6 shadow-card">
		<div class="text-xs font-medium uppercase tracking-wider text-muted">Today's Revenue</div>
		<div class="serif mt-2 text-3xl font-medium text-olive-deep">{formatPrice(data.todaysRevenue)}</div>
		<div class="mt-1 text-xs text-muted">{data.todaysOrdersCount} orders placed today</div>
	</div>

	<div class="rounded-[24px] border border-line bg-white p-6 shadow-card">
		<div class="text-xs font-medium uppercase tracking-wider text-muted">Total Orders Placed</div>
		<div class="serif mt-2 text-3xl font-medium text-ink">{data.totalOrders}</div>
		<div class="mt-1 text-xs text-muted">Across all fulfillment statuses</div>
	</div>

	<div class="rounded-[24px] border border-line bg-white p-6 shadow-card">
		<div class="text-xs font-medium uppercase tracking-wider text-muted">Registered Customers</div>
		<div class="serif mt-2 text-3xl font-medium text-ink">{data.totalCustomers}</div>
		<div class="mt-1 text-xs text-muted">Total customer accounts</div>
	</div>

	<div class="rounded-[24px] border border-line bg-white p-6 shadow-card">
		<div class="text-xs font-medium uppercase tracking-wider text-muted">Active Catalog Products</div>
		<div class="serif mt-2 text-3xl font-medium text-ink">{data.totalProducts}</div>
		<div class="mt-1 text-xs text-muted">Managed in catalog</div>
	</div>
</div>

<h2 class="serif mt-8 text-lg font-medium text-ink">Order Fulfillment Breakdown</h2>
<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
	<div class="rounded-[20px] border border-line bg-cream-deep/60 p-4 text-center">
		<div class="text-xs uppercase text-muted">Pending</div>
		<div class="serif mt-1 text-2xl font-medium text-terracotta">{data.statusBreakdown.pending}</div>
	</div>
	<div class="rounded-[20px] border border-line bg-cream-deep/60 p-4 text-center">
		<div class="text-xs uppercase text-muted">Confirmed</div>
		<div class="serif mt-1 text-2xl font-medium text-olive-deep">{data.statusBreakdown.confirmed}</div>
	</div>
	<div class="rounded-[20px] border border-line bg-cream-deep/60 p-4 text-center">
		<div class="text-xs uppercase text-muted">Packed</div>
		<div class="serif mt-1 text-2xl font-medium text-ink">{data.statusBreakdown.packed}</div>
	</div>
	<div class="rounded-[20px] border border-line bg-cream-deep/60 p-4 text-center">
		<div class="text-xs uppercase text-muted">Delivered</div>
		<div class="serif mt-1 text-2xl font-medium text-green-700">{data.statusBreakdown.delivered}</div>
	</div>
	<div class="rounded-[20px] border border-line bg-cream-deep/60 p-4 text-center">
		<div class="text-xs uppercase text-muted">Cancelled</div>
		<div class="serif mt-1 text-2xl font-medium text-red-600">{data.statusBreakdown.cancelled}</div>
	</div>
</div>
