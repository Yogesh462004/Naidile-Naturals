<script lang="ts">
	import type { ProductWithRelations, Category } from '$lib/supabase/types';
	import ProductCard from './ProductCard.svelte';
	import { goto } from '$app/navigation';

	let {
		products = [],
		categories = [],
		initialCategorySlug = '',
		title = 'Categories & Products',
		showTitle = true
	}: {
		products: ProductWithRelations[];
		categories?: any[];
		initialCategorySlug?: string;
		title?: string;
		showTitle?: boolean;
	} = $props();

	// State for active category (left sidebar) and price sort (right panel header)
	let selectedCategory = $state(initialCategorySlug);
	let priceSort = $state<'default' | 'low_to_high' | 'high_to_low'>('default');

	// Synchronize if initialCategorySlug prop changes from outside navigation
	$effect(() => {
		if (initialCategorySlug !== undefined) {
			selectedCategory = initialCategorySlug;
		}
	});

	function selectCategory(slug: string) {
		selectedCategory = slug;
		if (typeof window !== 'undefined' && window.location.pathname.startsWith('/category/')) {
			if (slug) goto(`/category/${slug}`, { keepFocus: true });
			else goto(`/search`, { keepFocus: true });
		}
	}

	// Filter and sort products (only category and price, no quantity)
	const filteredProducts = $derived.by(() => {
		let list = [...products];

		// 1. Filter by Category (Category Wise)
		if (selectedCategory) {
			list = list.filter(
				(p) => p.categories?.slug === selectedCategory || p.categories?.name === selectedCategory
			);
		}

		// 2. Sort by Price (Price: Low to High / High to Low)
		if (priceSort === 'low_to_high') {
			list.sort((a, b) => {
				const minA = Math.min(...(a.product_variants ?? []).map((v) => v.price), Infinity);
				const minB = Math.min(...(b.product_variants ?? []).map((v) => v.price), Infinity);
				return minA - minB;
			});
		} else if (priceSort === 'high_to_low') {
			list.sort((a, b) => {
				const minA = Math.min(...(a.product_variants ?? []).map((v) => v.price), Infinity);
				const minB = Math.min(...(b.product_variants ?? []).map((v) => v.price), Infinity);
				return minB - minA;
			});
		}

		return list;
	});

	function getCategoryIcon(c: any) {
		if (c?.icon && c.icon !== '🌿') return c.icon;
		const s = `${c?.slug || ''} ${c?.name || ''}`.toLowerCase();
		if (s.includes('skin')) return '🌸';
		if (s.includes('hair')) return '🌾';
		if (s.includes('clean')) return '💧';
		if (s.includes('powder')) return '🌰';
		return '🌿';
	}

	// Get active category display object for right side title
	const activeCategoryObj = $derived.by(() => {
		if (!selectedCategory) return { name: 'All Categories', icon: '🌐' };
		const found = categories.find((c) => c.slug === selectedCategory || c.name === selectedCategory);
		return found ? { ...found, icon: getCategoryIcon(found) } : { name: selectedCategory, icon: '🌿' };
	});
</script>

<div class="w-full">
	{#if showTitle}
		<div class="mb-4 flex items-center justify-between">
			<h3 class="serif text-xl font-medium text-olive-deep sm:text-2xl">{title}</h3>
			<span class="text-xs font-medium text-muted">
				Showing <strong class="text-terracotta">{filteredProducts.length}</strong> products
			</span>
		</div>
	{/if}

	<!-- Side-by-Side Flipkart / Zepto style layout -->
	<div class="flex min-h-[540px] w-full overflow-hidden rounded-2xl border border-line bg-white shadow-card">
		<!-- Left Side: Vertical Category Sidebar -->
		<aside class="w-[84px] flex-shrink-0 border-r border-line bg-cream-deep/60 py-2 sm:w-[124px] md:w-[156px]">
			<nav class="flex flex-col gap-1">
				<!-- All Categories Item -->
				<button
					type="button"
					onclick={() => selectCategory('')}
					class="group relative flex flex-col items-center justify-center py-3 px-1 text-center transition sm:flex-row sm:justify-start sm:gap-2.5 sm:px-3 sm:py-3.5 {selectedCategory === ''
						? 'bg-white font-semibold text-olive-deep shadow-2xs'
						: 'text-body hover:bg-white/60 hover:text-olive-deep'}"
				>
					{#if selectedCategory === ''}
						<span class="absolute top-0 left-0 bottom-0 w-1 rounded-r bg-terracotta"></span>
					{/if}
					<span
						class="flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-2xs transition sm:h-9 sm:w-9 {selectedCategory === ''
							? 'bg-terracotta text-white shadow-sm'
							: 'bg-white text-olive-deep group-hover:scale-105'}"
					>
						🌐
					</span>
					<span class="mt-1.5 text-[0.68rem] leading-tight font-medium sm:mt-0 sm:text-xs">
						All Categories
					</span>
				</button>

				<!-- Dynamic Categories list -->
				{#each categories as c (c.slug)}
					<button
						type="button"
						onclick={() => selectCategory(c.slug)}
						class="group relative flex flex-col items-center justify-center py-3 px-1 text-center transition sm:flex-row sm:justify-start sm:gap-2.5 sm:px-3 sm:py-3.5 {selectedCategory === c.slug
							? 'bg-white font-semibold text-olive-deep shadow-2xs'
							: 'text-body hover:bg-white/60 hover:text-olive-deep'}"
					>
						{#if selectedCategory === c.slug}
							<span class="absolute top-0 left-0 bottom-0 w-1 rounded-r bg-terracotta"></span>
						{/if}
						<span
							class="flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-2xs transition sm:h-9 sm:w-9 {selectedCategory === c.slug
								? 'bg-terracotta text-white shadow-sm'
								: 'bg-white text-olive-deep group-hover:scale-105'}"
						>
							{getCategoryIcon(c)}
						</span>
						<span class="mt-1.5 text-[0.68rem] leading-tight font-medium sm:mt-0 sm:text-xs sm:text-left">
							{c.name}
						</span>
					</button>
				{/each}
			</nav>
		</aside>

		<!-- Right Side: Main Content Panel (Active Category Title + Price Sort + Product Cards Grid) -->
		<main class="flex-1 overflow-y-auto bg-cream/15 p-3 sm:p-4 md:p-6">
			<!-- Right Panel Header: Active Category & Price Sort (Low to High / High to Low) -->
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
				<div class="flex items-center gap-2">
					<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 text-base text-terracotta">
						{activeCategoryObj.icon ?? '🌿'}
					</span>
					<div>
						<h4 class="serif text-base font-semibold text-olive-deep sm:text-lg">
							{activeCategoryObj.name}
						</h4>
						<p class="text-[0.7rem] text-muted">
							{filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
						</p>
					</div>
				</div>

				<!-- Price Sort Selector (Only price low to high / high to low) -->
				<div class="flex items-center gap-2">
					<div class="relative">
						<select
							bind:value={priceSort}
							aria-label="Sort products by price"
							class="appearance-none rounded-xl border border-gold/50 bg-white py-2 pr-8 pl-3 text-xs font-semibold text-olive-deep shadow-2xs transition focus:border-terracotta focus:outline-none"
						>
							<option value="default">Sort by: Featured</option>
							<option value="low_to_high">Price: Low to High ⬆️</option>
							<option value="high_to_low">Price: High to Low ⬇️</option>
						</select>
						<span class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[0.65rem] text-olive-deep/70">
							▼
						</span>
					</div>

					{#if priceSort !== 'default' || selectedCategory !== initialCategorySlug}
						<button
							type="button"
							onclick={() => {
								selectCategory(initialCategorySlug || '');
								priceSort = 'default';
							}}
							class="rounded-xl border border-line bg-cream px-2.5 py-2 text-[0.7rem] font-semibold text-terracotta transition hover:bg-terracotta hover:text-white"
						>
							Reset
						</button>
					{/if}
				</div>
			</div>

			<!-- Product Cards Grid inside Right Panel -->
			{#if filteredProducts.length === 0}
				<div class="my-8 rounded-2xl border border-line bg-cream-deep/60 p-6 text-center">
					<span class="mb-2 block text-3xl">🔍</span>
					<h5 class="serif text-base font-medium text-olive-deep">No items in this category yet</h5>
					<p class="mt-1 text-xs text-muted">
						We are crafting new herbal creations for {activeCategoryObj.name}. Check back soon or select another category from the sidebar.
					</p>
					<button
						type="button"
						onclick={() => selectCategory('')}
						class="mt-3 inline-block rounded-xl bg-terracotta px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-terracotta/90"
					>
						View All Categories
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredProducts as product (product.id)}
						<ProductCard {product} />
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>
