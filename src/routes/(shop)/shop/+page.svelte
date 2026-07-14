<script lang="ts">
	import FrameHero from '$lib/components/FrameHero.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();

	let selectedCategorySlug = $state('all');

	let products = $derived(data.allProducts || data.products || []);

	let filteredProducts = $derived(
		selectedCategorySlug === 'all'
			? products
			: products.filter((p: any) => p.categories?.slug === selectedCategorySlug)
	);
</script>

<svelte:head>
	<title>Shop All Products — Naidile Naturals</title>
	<meta name="description" content="Browse our complete collection of natural & Ayurvedic skin and hair care products." />
</svelte:head>

<div class="px-5 pt-3">
	<a href="/" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Home
	</a>
</div>

<Breadcrumb items={[{ label: 'Shop', href: '/shop' }]} />

<div class="animate-fade-in">
	<FrameHero compact floral eyebrow="Naidile Collection">Shop All Products</FrameHero>

	<section class="px-5 pt-6">
		<span class="eyebrow block mb-2">Filter by Category</span>
		<div class="flex flex-wrap gap-2">
			<button
				onclick={() => (selectedCategorySlug = 'all')}
				class="rounded-full px-4 py-2 text-xs font-medium border transition-all cursor-pointer {selectedCategorySlug === 'all'
					? 'bg-olive-deep text-white border-olive-deep shadow-xs'
					: 'bg-white text-ink border-line hover:border-olive-deep/45'}"
			>
				All Products ({products.length})
			</button>
			{#each data.categories as cat}
				<button
					onclick={() => (selectedCategorySlug = cat.slug)}
					class="rounded-full px-4 py-2 text-xs font-medium border transition-all cursor-pointer {selectedCategorySlug === cat.slug
						? 'bg-olive-deep text-white border-olive-deep shadow-xs'
						: 'bg-white text-ink border-line hover:border-olive-deep/45'}"
				>
					{cat.name}
				</button>
			{/each}
		</div>
	</section>

	<section class="grid grid-cols-1 gap-4 px-5 py-[26px] sm:grid-cols-2 lg:grid-cols-3">
		{#each filteredProducts as product (product.id)}
			<ProductCard {product} />
		{:else}
			<div class="col-span-full rounded-[18px] border border-line bg-cream-deep p-8 text-center">
				<span class="block text-3xl mb-2">🌿</span>
				<p class="text-sm text-placeholder">No products found in this category.</p>
			</div>
		{/each}
	</section>
</div>
