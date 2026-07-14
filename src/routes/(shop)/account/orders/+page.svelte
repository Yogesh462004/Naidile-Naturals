<script lang="ts">
	import { formatPrice } from '$lib/utils/format';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();

	const statusColor: Record<string, string> = {
		pending: 'text-gold',
		confirmed: 'text-olive-deep',
		packed: 'text-olive-deep',
		delivered: 'text-olive',
		cancelled: 'text-terracotta'
	};
</script>

<svelte:head>
	<title>My Orders — Naidile Naturals</title>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/account" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to My Account
	</a>
</div>

<Breadcrumb items={[{ label: 'My Account', href: '/account' }, { label: 'My Orders' }]} />

<div class="animate-fade-in mx-auto max-w-2xl px-5 pb-8 pt-2">
	<h1 class="text-2xl">My Orders</h1>

	{#if data.orders.length === 0}
		<p class="mt-8 text-center text-sm text-placeholder">You haven't placed any orders yet.</p>
	{:else}
		<div class="mt-5 flex flex-col gap-4">
			{#each data.orders as order (order.id)}
				<div class="rounded-2xl border border-line bg-white p-4">
					<div class="flex items-center justify-between">
						<div class="flex flex-col gap-0.5">
							<span class="font-mono text-xs font-semibold text-ink">#{order.id.slice(0, 8)}</span>
							<span class="text-[0.7rem] text-muted">{new Date(order.created_at).toLocaleDateString()}</span>
						</div>
						<span class="text-xs font-medium tracking-wide uppercase {statusColor[order.status]}"
							>{order.status}</span
						>
					</div>
					<div class="mt-2 flex flex-col gap-1 text-sm">
						{#each order.order_items as item (item.id)}
							<div class="flex justify-between">
								<span>{item.product_name} ({item.variant_size}) ×{item.qty}</span>
								<span>{formatPrice(item.price * item.qty)}</span>
							</div>
						{/each}
					</div>
					<div class="mt-2 flex justify-between border-t border-line pt-2 text-sm font-medium">
						<span>Total</span>
						<span>{formatPrice(order.total)}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
