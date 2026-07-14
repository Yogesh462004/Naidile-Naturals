<script lang="ts">
	import { formatPrice } from '$lib/utils/format';
	import Button from '$lib/components/Button.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Order Confirmed — Naidile Naturals</title>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Home
	</a>
</div>

<Breadcrumb items={[{ label: 'Checkout', href: '/checkout' }, { label: 'Order Confirmed' }]} />

<div class="animate-fade-in mx-auto max-w-xl px-5 pb-[36px] pt-2 text-center">
	<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-olive-deep/15 text-4xl text-olive-deep">
		🎉
	</div>

	<h1 class="serif mt-5 text-2xl font-medium text-ink">Order Confirmation Screen</h1>
	<p class="mt-2 text-sm text-body">
		Your order has been recorded and your WhatsApp chat was opened to send the details directly to our team!
	</p>

	{#if data.order}
		<div class="mt-6 rounded-[24px] border border-line bg-white p-6 text-left shadow-card">
			<div class="flex items-center justify-between border-b border-line pb-4">
				<div>
					<span class="text-xs uppercase tracking-wider text-muted font-medium">Order Reference</span>
					<div class="serif text-lg font-medium text-ink">#{data.order.id.slice(0, 8)}</div>
				</div>
				<span class="rounded-full bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta capitalize">
					{data.order.status}
				</span>
			</div>

			<div class="mt-4 flex flex-col gap-2 text-sm text-body">
				{#each data.items as item (item.id)}
					<div class="flex justify-between">
						<span><strong class="font-medium text-ink">{item.product_name}</strong> ({item.variant_size}) ×{item.qty}</span>
						<span>{formatPrice(item.price * item.qty)}</span>
					</div>
				{/each}
				<div class="mt-3 flex justify-between border-t border-line pt-3 font-medium text-ink">
					<span>Total Amount</span>
					<span class="serif text-lg text-terracotta">{formatPrice(data.order.total)}</span>
				</div>
			</div>

			<div class="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
				<strong class="font-medium text-ink">Delivery Address:</strong><br />
				{data.order.customer_name} ({data.order.customer_phone})<br />
				{data.order.customer_address}
			</div>
		</div>
	{/if}

	<div class="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
		<a href="/account/orders" class="w-full sm:w-auto">
			<Button variant="secondary">View My Orders</Button>
		</a>
		<a href="/" class="w-full sm:w-auto">
			<Button variant="terracotta">Continue Shopping</Button>
		</a>
	</div>
</div>
