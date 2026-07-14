<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate, goto } from '$app/navigation';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import SizeOptions from '$lib/components/SizeOptions.svelte';
	import QtyStepper from '$lib/components/QtyStepper.svelte';
	import Button from '$lib/components/Button.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import LoginRequiredModal from '$lib/components/LoginRequiredModal.svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { showToast } from '$lib/stores/toast.svelte';
	import { formatPrice } from '$lib/utils/format';

	let { data } = $props();
	const product = $derived(data.product);

	let selected = $state(
		product.product_variants.find((v: { stock: number }) => v.stock > 0) ?? product.product_variants[0]
	);
	let qty = $state(1);
	let showLoginModal = $state(false);

	const existingInCart = $derived(cart.items.find((i) => i.variantId === selected?.id));

	const purchasable = $derived(product.status === 'available' || product.status === 'out_of_stock');
	const statusMessage: Record<string, string> = {
		coming_soon: 'Coming soon',
		discontinued: 'No longer available',
		out_of_stock: 'Out of stock'
	};

	function addToCart() {
		if (!data.session) {
			showLoginModal = true;
			return;
		}
		if (!selected) return;
		const existing = cart.items.find((i) => i.variantId === selected.id);
		const currentQty = existing ? existing.qty : 0;
		if (selected.stock !== undefined && currentQty + qty > selected.stock) {
			showToast(`⚠️ Out of stock! You can only have up to ${selected.stock} items of ${selected.size} (${currentQty} already in cart).`);
			return;
		}
		cart.add(
			{
				productId: product.id,
				variantId: selected.id,
				slug: product.slug,
				name: product.name,
				size: selected.size,
				price: selected.price,
				image: product.product_images[0]?.url ?? null,
				stock: selected.stock
			},
			qty
		);
		showToast(`Added ${selected.size} ${product.name} ×${qty} to cart`);
		qty = 1;
	}

	function buyNow() {
		if (!data.session) {
			showLoginModal = true;
			return;
		}
		if (!selected) return;
		const existing = cart.items.find((i) => i.variantId === selected.id);
		const currentQty = existing ? existing.qty : 0;
		if (selected.stock !== undefined && currentQty + qty > selected.stock) {
			showToast(`⚠️ Out of stock! You can only have up to ${selected.stock} items of ${selected.size}.`);
			return;
		}
		cart.add(
			{
				productId: product.id,
				variantId: selected.id,
				slug: product.slug,
				name: product.name,
				size: selected.size,
				price: selected.price,
				image: product.product_images[0]?.url ?? null,
				stock: selected.stock
			},
			qty
		);
		goto('/checkout');
	}

	onMount(() => {
		const channel = data.supabase
			.channel(`product-${product.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'products', filter: `id=eq.${product.id}` },
				() => invalidate('supabase:db:product')
			)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'product_variants', filter: `product_id=eq.${product.id}` },
				() => invalidate('supabase:db:product')
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	});
</script>

<svelte:head>
	<title>{product.name} — Naidile Naturals</title>
	{#if product.description}<meta name="description" content={product.description} />{/if}
</svelte:head>

<div class="px-5 pt-3">
	<a
		href="/category/{product.categories?.slug || ''}"
		class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1"
	>
		&larr; Back to {product.categories?.name || 'Category'}
	</a>
</div>

<Breadcrumb
	items={[
		{ label: product.categories?.name || 'Category', href: `/category/${product.categories?.slug}` },
		{ label: product.name }
	]}
/>

<div class="animate-fade-in px-5 pb-5 pt-2">
	<div class="md:grid md:grid-cols-2 md:items-start md:gap-8">
		<div class="-mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 md:mx-0 md:flex-wrap md:overflow-visible">
			{#each product.product_images.length ? product.product_images : [{ id: 'placeholder', url: '/images/product-sunscreen.jpg' }] as img (img.id)}
				<div class="aspect-square w-[85%] md:w-full shrink-0 snap-center rounded-[14px] bg-cream-deep p-4 flex items-center justify-center overflow-hidden">
					<img
						src={img.url}
						alt={product.name}
						class="max-h-full max-w-full rounded-[10px] object-contain"
					/>
				</div>
			{/each}
		</div>

		<div>
			<div class="mt-4 flex flex-col gap-1 md:mt-0">
				{#if product.eyebrow}<span class="eyebrow">{product.eyebrow}</span>{/if}
				<h1 class="serif text-[1.35rem]">{product.name}</h1>
			</div>

			{#if statusMessage[product.status]}
				<span class="mt-2 inline-block text-sm font-medium text-terracotta">{statusMessage[product.status]}</span>
			{/if}

			{#if product.description}
				<p class="mt-3 text-[0.94rem] text-body">{product.description}</p>
			{/if}

			{#if product.care_note}
				<div class="mt-3 flex items-start gap-2 rounded-xl bg-cream-deep p-3 text-sm text-muted">
					<span>❄️</span>
					<span>{product.care_note}</span>
				</div>
			{/if}

			{#if product.benefits}
				<div class="mt-4">
					<h2 class="text-base">Benefits</h2>
					<p class="mt-1 text-[0.94rem] text-body">{product.benefits}</p>
				</div>
			{/if}

			{#if product.ingredients}
				<div class="mt-4">
					<h2 class="text-base">Ingredients</h2>
					<p class="mt-1 text-[0.94rem] text-body">{product.ingredients}</p>
				</div>
			{/if}

			{#if product.usage_instructions}
				<div class="mt-4">
					<h2 class="text-base">How to Use</h2>
					<p class="mt-1 text-[0.94rem] text-body">{product.usage_instructions}</p>
				</div>
			{/if}

			{#if purchasable && selected}
				<div class="mt-5">
					<span class="eyebrow">Choose Size</span>
					<div class="mt-2">
						<SizeOptions variants={product.product_variants} bind:selected onselect={() => (qty = 1)} />
					</div>
				</div>

				{#if existingInCart && existingInCart.qty > 0}
					<div class="mt-5 rounded-2xl border-2 border-terracotta bg-[#fbf2ed] p-4.5 shadow-xs transition-all">
						<div class="flex items-center justify-between gap-2 border-b border-terracotta/20 pb-3">
							<div class="flex items-center gap-2 text-sm font-semibold text-terracotta">
								<span class="text-base">🛒</span>
								<span>Already in your Cart ({existingInCart.qty} of {selected.size})</span>
							</div>
							<span class="serif text-base font-medium text-ink">{formatPrice(existingInCart.price * existingInCart.qty)}</span>
						</div>
						<div class="mt-3.5 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<span class="text-xs font-medium text-muted">Cart Qty:</span>
								<QtyStepper
									qty={existingInCart.qty}
									max={selected.stock}
									onchange={(q) => cart.updateQty(selected.id, q)}
								/>
							</div>
							<button
								type="button"
								class="text-xs font-semibold text-terracotta underline transition hover:opacity-75"
								onclick={() => cart.remove(selected.id)}
							>
								Remove from Cart
							</button>
						</div>
					</div>

					<div class="mt-4 flex flex-col gap-3 sm:flex-row">
						<Button
							variant="secondary"
							class="flex-1"
							onclick={() => goto('/cart')}
						>
							View Cart & Checkout
						</Button>
					</div>
				{:else}
					<div class="mt-4 flex items-center justify-between">
						<span class="text-sm text-muted">Quantity</span>
						<QtyStepper bind:qty max={selected.stock} />
					</div>

					<div class="mt-5 flex flex-col gap-3 sm:flex-row">
						<Button variant="terracotta" class="flex-1" onclick={addToCart} disabled={selected.stock <= 0}>
							Add to Cart — {formatPrice(selected.price * qty)}
						</Button>
						<Button variant="secondary" class="flex-1" onclick={buyNow} disabled={selected.stock <= 0}>
							Buy Now
						</Button>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	{#if data.related.length}
		<div class="mt-8">
			<h2 class="text-base">Related Products</h2>
			<div class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
				{#each data.related as p (p.id)}
					<ProductCard product={p} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<LoginRequiredModal bind:open={showLoginModal} returnUrl={`/product/${product.slug}`} />
