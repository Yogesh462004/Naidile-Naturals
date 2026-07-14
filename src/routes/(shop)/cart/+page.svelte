<script lang="ts">
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice } from '$lib/utils/format';
	import Button from '$lib/components/Button.svelte';
	import QtyStepper from '$lib/components/QtyStepper.svelte';
	import LoginRequiredModal from '$lib/components/LoginRequiredModal.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();
	let showLoginModal = $state(false);

	function proceedToCheckout() {
		if (!data.session) {
			showLoginModal = true;
			return;
		}
		goto('/checkout');
	}
</script>

<svelte:head>
	<title>Your Cart — Naidile Naturals</title>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/shop" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Continue Shopping
	</a>
</div>

<Breadcrumb items={[{ label: 'Your Cart' }]} />

<div class="animate-fade-in mx-auto max-w-2xl px-5 pb-8 pt-2">
	<h1 class="text-2xl">Your Cart</h1>

	{#if cart.items.length === 0}
		<div class="mt-10 flex flex-col items-center gap-2 text-center text-sm text-placeholder">
			<span class="text-3xl">🌿</span>
			Your cart is empty.<br />Explore our skin care range to begin.
			<a href="/shop" class="mt-3 text-terracotta underline">Shop All Products</a>
		</div>
	{:else}
		<div class="mt-5 flex flex-col gap-4">
			{#each cart.items as item (item.variantId)}
				<div class="flex gap-3 border-b border-line pb-4">
					{#if item.image}
						<a href="/product/{item.slug}" class="h-20 w-20 rounded-[10px] bg-cream-deep border border-line flex items-center justify-center p-1.5 overflow-hidden shrink-0">
							<img src={item.image} alt={item.name} class="max-h-full max-w-full rounded-[6px] object-contain" />
						</a>
					{/if}
					<div class="flex flex-1 flex-col justify-between">
						<div>
							<a href="/product/{item.slug}" class="serif text-sm">{item.name}</a>
							<div class="text-xs text-muted">{item.size} · {formatPrice(item.price)} each</div>
						</div>
						<div class="flex items-center justify-between">
							<QtyStepper qty={item.qty} max={item.stock} onchange={(q) => cart.updateQty(item.variantId, q)} />
							<button class="text-xs text-terracotta underline font-medium hover:opacity-80" onclick={() => cart.remove(item.variantId)}
								>Remove</button
							>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-5 flex items-center justify-between text-base">
			<span>Total</span>
			<span class="serif text-lg">{formatPrice(cart.totalPrice)}</span>
		</div>

		<div class="mt-5">
			<Button onclick={proceedToCheckout}>Proceed to Checkout</Button>
		</div>
	{/if}
</div>

<LoginRequiredModal bind:open={showLoginModal} returnUrl="/checkout" />
