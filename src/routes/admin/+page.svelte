<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatPrice } from '$lib/utils/format';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();
	let refreshing = $state(false);

	async function retryFetch() {
		refreshing = true;
		await invalidateAll();
		refreshing = false;
	}
</script>

<svelte:head>
	<title>Admin Dashboard — Naidile Naturals</title>
</svelte:head>

{#if data.error}
	<div class="rounded-[20px] border border-terracotta/30 bg-terracotta/5 p-8 text-center my-8" role="alert" aria-live="polite">
		<span class="text-3xl">⚠️</span>
		<h1 class="mt-2 serif text-xl font-medium text-terracotta">Database Offline or Error</h1>
		<p class="mt-1 text-sm text-body">{data.errorMessage || 'Unable to fetch dashboard.'}</p>
		<div class="mt-5">
			<Button variant="terracotta" onclick={retryFetch} disabled={refreshing}>
				{refreshing ? 'Retrying…' : 'Retry'}
			</Button>
		</div>
	</div>
{:else}
	<div class="flex items-center justify-between">
		<div>
			<h1 class="serif text-2xl font-medium text-ink">Dashboard Overview</h1>
			<p class="text-xs text-muted">Real-time store catalog, orders, inventory, and revenue summary</p>
		</div>
		<button
			onclick={retryFetch}
			disabled={refreshing}
			class="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink hover:bg-stone-50 transition shadow-sm"
		>
			{refreshing ? 'Refreshing…' : '🔄 Refresh Data'}
		</button>
	</div>

	<!-- Top Metrics -->
	<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
		<div class="rounded-[20px] border border-line bg-white p-5 shadow-card flex flex-col justify-between">
			<div class="text-xs uppercase text-muted font-medium tracking-wider">Total Products</div>
			<div class="serif mt-2 text-3xl text-ink font-semibold">{data.productCount}</div>
		</div>
		<div class="rounded-[20px] border border-line bg-white p-5 shadow-card flex flex-col justify-between">
			<div class="text-xs uppercase text-muted font-medium tracking-wider">Total Orders</div>
			<div class="serif mt-2 text-3xl text-ink font-semibold">{data.orderCount}</div>
		</div>
		<div class="rounded-[20px] border border-line bg-white p-5 shadow-card flex flex-col justify-between">
			<div class="text-xs uppercase text-muted font-medium tracking-wider">Total Customers</div>
			<div class="serif mt-2 text-3xl text-ink font-semibold">{data.customerCount}</div>
		</div>
		<div class="rounded-[20px] border border-line bg-white p-5 shadow-card flex flex-col justify-between">
			<div class="text-xs uppercase text-muted font-medium tracking-wider">Today's Orders</div>
			<div class="serif mt-2 text-3xl text-terracotta font-semibold">{data.todaysOrdersCount}</div>
		</div>
		<div class="rounded-[20px] border border-line bg-white p-5 shadow-card flex flex-col justify-between bg-cream">
			<div class="text-xs uppercase text-olive-deep font-bold tracking-wider">Net Revenue</div>
			<div class="serif mt-2 text-3xl text-olive-deep font-bold">{formatPrice(data.totalRevenue)}</div>
			<div class="text-[10px] text-muted mt-1">(Excludes Cancelled Orders)</div>
		</div>
	</div>

	<!-- Edge Cases Alerts: No Products / No Orders / No Customers -->
	{#if data.productCount === 0}
		<div class="mt-6 rounded-[20px] border border-line bg-white p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
			<div>
				<h3 class="serif text-base font-medium text-ink">No products available in your store.</h3>
				<p class="text-xs text-muted">Your product catalog is empty. Start adding items to display them to customers.</p>
			</div>
			<a href="/admin/products" class="rounded-xl bg-terracotta px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:opacity-90">
				+ Add Product
			</a>
		</div>
	{/if}

	{#if data.customerCount === 0}
		<div class="mt-4 rounded-[20px] border border-line bg-cream/60 p-4 text-xs text-muted flex items-center justify-between">
			<span>No registered customers yet. New signups will appear here automatically.</span>
			<a href="/admin/customers" class="text-terracotta hover:underline font-medium">View Customer List →</a>
		</div>
	{/if}

	<!-- Inventory Warnings: Low Stock & Out of Stock -->
	{#if data.outOfStockProducts.length > 0 || data.lowStockProducts.length > 0}
		<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
			{#if data.outOfStockProducts.length > 0}
				<div class="rounded-[20px] border border-terracotta/40 bg-terracotta/5 p-5">
					<div class="flex items-center justify-between">
						<h3 class="serif text-base font-semibold text-terracotta flex items-center gap-2">
							<span>🚨 Out of Stock Products ({data.outOfStockProducts.length})</span>
						</h3>
						<a href="/admin/products" class="text-xs font-medium text-terracotta underline">Restock Now</a>
					</div>
					<div class="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
						{#each data.outOfStockProducts as p (p.id)}
							<div class="flex items-center justify-between rounded-xl bg-white/80 p-2.5 text-xs border border-terracotta/20">
								<span class="font-medium text-ink">{p.name}</span>
								<span class="rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-bold text-white uppercase">Stock: 0</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if data.lowStockProducts.length > 0}
				<div class="rounded-[20px] border border-amber-500/40 bg-amber-500/5 p-5">
					<div class="flex items-center justify-between">
						<h3 class="serif text-base font-semibold text-amber-800 flex items-center gap-2">
							<span>⚠️ Low Stock Warnings ({data.lowStockProducts.length})</span>
						</h3>
						<a href="/admin/products" class="text-xs font-medium text-amber-800 underline">Manage Stock</a>
					</div>
					<div class="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
						{#each data.lowStockProducts as p (p.id)}
							<div class="flex items-center justify-between rounded-xl bg-white/80 p-2.5 text-xs border border-amber-500/20">
								<span class="font-medium text-ink">{p.name}</span>
								<span class="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">Stock: {p.stock} remaining</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Today's Orders -->
	{#if data.todaysOrdersCount > 0}
		<div class="mt-8">
			<div class="flex items-center justify-between">
				<h2 class="serif text-lg font-medium text-ink">Today's Orders ({data.todaysOrdersCount})</h2>
				<a href="/admin/orders" class="text-xs text-terracotta underline hover:text-ink">Manage All Orders →</a>
			</div>
			<div class="mt-3 flex flex-col gap-2">
				{#each data.todaysOrders as order (order.id)}
					<a
						href="/admin/orders"
						class="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-olive-deep"
					>
						<div>
							<span class="font-medium text-ink">{order.customer_name || 'Guest Order'}</span>
							<span class="text-xs text-muted"> · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="rounded-full bg-olive-deep/10 px-2.5 py-0.5 text-xs font-medium text-olive-deep capitalize">
								{order.status || 'Pending'}
							</span>
							<span class="font-semibold text-ink">{formatPrice(order.total || order.total_amount)}</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recent Orders -->
	<div class="mt-8 flex items-center justify-between">
		<h2 class="serif text-lg font-medium text-ink">Recent Orders</h2>
		<a href="/admin/orders" class="text-xs text-terracotta underline hover:text-ink">View All Orders →</a>
	</div>

	{#if data.recentOrders.length === 0}
		<div class="mt-3 rounded-[20px] border border-line bg-white p-8 text-center text-sm text-placeholder">
			No orders yet. Once customers place orders, they will appear right here.
		</div>
	{:else}
		<div class="mt-3 flex flex-col gap-2">
			{#each data.recentOrders as order (order.id)}
				<a
					href="/admin/orders"
					class="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm shadow-sm transition-colors hover:border-olive-deep"
				>
					<div>
						<span class="font-medium text-ink">{order.customer_name || 'Customer'}</span>
						<span class="text-xs text-muted"> · {new Date(order.created_at).toLocaleString()}</span>
					</div>
					<div class="flex items-center gap-3">
						<span
							class="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize {order.status?.toLowerCase() ===
							'cancelled'
								? 'bg-terracotta/15 text-terracotta line-through'
								: order.status?.toLowerCase() === 'delivered'
									? 'bg-emerald-600/15 text-emerald-700'
									: 'bg-olive-deep/10 text-olive-deep'}"
						>
							{order.status || 'pending'}
						</span>
						<span class="font-medium {order.status?.toLowerCase() === 'cancelled' ? 'text-muted line-through' : 'text-terracotta'}">
							{formatPrice(order.total || order.total_amount)}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
{/if}
