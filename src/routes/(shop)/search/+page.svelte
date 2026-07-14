<script lang="ts">
	import { goto } from '$app/navigation';
	import ProductFilterSection from '$lib/components/ProductFilterSection.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Search & Explore — Naidile Naturals</title>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Home
	</a>
</div>

<Breadcrumb items={[{ label: 'Search' }]} />

<div class="animate-fade-in px-5 pb-8 pt-2">
	<div class="mb-5">
		<h1 class="serif text-2xl font-medium text-olive-deep">
			{data.q ? `Search Results for "${data.q}"` : 'Explore Our Products'}
		</h1>
		<p class="mt-1 text-xs text-muted">Select any category from the sidebar and sort by price</p>
	</div>

	<ProductFilterSection
		products={data.allProducts || data.products || []}
		categories={data.categories || []}
		initialCategorySlug={data.categorySlug}
		title={data.q ? `Matching "${data.q}"` : 'All Products'}
		showTitle={false}
	/>
</div>
