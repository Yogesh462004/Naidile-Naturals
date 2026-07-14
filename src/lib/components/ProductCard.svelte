<script lang="ts">
	import { formatPrice } from '$lib/utils/format';
	import type { ProductWithRelations } from '$lib/supabase/types';

	let { product }: { product: ProductWithRelations } = $props();

	const image = product.product_images[0]?.url ?? '/images/product-sunscreen.jpg';
	const prices = product.product_variants.map((v) => v.price);
	const minPrice = prices.length ? Math.min(...prices) : null;

	const statusLabel: Record<string, string> = {
		out_of_stock: 'Out of Stock',
		coming_soon: 'Coming Soon',
		discontinued: 'Discontinued'
	};
</script>

<a
	href="/product/{product.slug}"
	class="group block overflow-hidden rounded-[20px] bg-white shadow-sm border border-line/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-olive-deep/30"
>
	<div class="aspect-square w-full flex items-center justify-center bg-cream-deep p-3 overflow-hidden rounded-[14px]">
		<img src={image} alt={product.name} class="max-h-full max-w-full rounded-[10px] object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
	</div>
	<div class="flex flex-col gap-1 p-4">
		{#if product.eyebrow}<span class="eyebrow">{product.eyebrow}</span>{/if}
		<span class="serif text-[1.1rem] text-ink group-hover:text-olive-deep transition-colors">{product.name}</span>
		{#if statusLabel[product.status]}
			<span class="text-xs font-medium text-terracotta">{statusLabel[product.status]}</span>
		{:else if minPrice !== null}
			<span class="text-sm text-body">From {formatPrice(minPrice)}</span>
		{/if}
	</div>
</a>
