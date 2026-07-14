<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { formatPrice } from '$lib/utils/format';
	import { smartSearchMatch } from '$lib/utils/search';

	let { data } = $props();
	let searchQuery = $state('');

	const statusLabel: Record<string, string> = {
		available: 'Available',
		out_of_stock: 'Out of Stock',
		coming_soon: 'Coming Soon',
		hidden: 'Hidden',
		discontinued: 'Discontinued'
	};

	let filtered = $derived(
		!searchQuery.trim()
			? data.products
			: data.products.filter((p) =>
					smartSearchMatch(searchQuery, [
						p.name,
						p.categories?.name,
						p.description,
						p.ingredients,
						p.benefits,
						p.slug
					])
				)
	);

	async function refresh() {
		await invalidate('supabase:db:admin-products');
	}

	async function toggleHide(product: (typeof data.products)[number]) {
		const nextStatus = product.status === 'hidden' ? 'available' : 'hidden';
		const nextActive = nextStatus === 'available';
		await data.supabase.from('products').update({ status: nextStatus, is_active: nextActive }).eq('id', product.id);
		await refresh();
	}

	async function duplicate(product: (typeof data.products)[number]) {
		const { data: copy, error } = await data.supabase
			.from('products')
			.insert({
				category_id: product.category_id,
				slug: `${product.slug}-copy-${Date.now().toString(36)}`,
				name: `${product.name} (Copy)`,
				eyebrow: product.eyebrow,
				description: product.description,
				care_note: product.care_note,
				ingredients: product.ingredients,
				benefits: product.benefits,
				usage_instructions: product.usage_instructions,
				usage: product.usage ?? product.usage_instructions,
				price: product.price ?? 0,
				stock: product.stock ?? 0,
				image_url: product.image_url ?? product.product_images?.[0]?.url ?? null,
				status: 'hidden',
				is_active: false
			})
			.select()
			.single();
		if (error || !copy) return;

		if (product.product_variants.length) {
			await data.supabase.from('product_variants').insert(
				product.product_variants.map((v) => ({
					product_id: copy.id,
					size: v.size,
					price: v.price,
					stock: v.stock,
					sort_order: v.sort_order
				}))
			);
		}
		if (product.product_images.length) {
			await data.supabase.from('product_images').insert(
				product.product_images.map((i) => ({ product_id: copy.id, url: i.url, sort_order: i.sort_order }))
			);
		}
		await refresh();
	}

	async function remove(product: (typeof data.products)[number]) {
		if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
		await data.supabase.from('products').delete().eq('id', product.id);
		await refresh();
	}

	async function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= filtered.length) return;
		const a = filtered[index];
		const b = filtered[target];
		await Promise.all([
			data.supabase.from('products').update({ sort_order: b.sort_order }).eq('id', a.id),
			data.supabase.from('products').update({ sort_order: a.sort_order }).eq('id', b.id)
		]);
		await refresh();
	}
</script>

<svelte:head>
	<title>Products — Admin</title>
</svelte:head>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<h1 class="text-2xl">Products ({filtered.length})</h1>
	<div class="flex items-center gap-3">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search products, category, ingredients…"
			aria-label="Search products"
			class="rounded-full border border-line bg-white px-4 py-2 text-sm focus:border-gold focus:outline-none sm:w-64 shadow-xs"
		/>
		<a href="/admin/products/new" class="rounded-full bg-terracotta px-4 py-2 text-sm text-white whitespace-nowrap shadow-sm hover:opacity-90">+ Add Product</a>
	</div>
</div>

<div class="mt-5 flex flex-col gap-3">
	{#each filtered as product, i (product.id)}
		<div class="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center shadow-xs">
			<div class="h-16 w-16 rounded-lg bg-cream-deep border border-line flex items-center justify-center p-1 overflow-hidden shrink-0">
				<img
					src={product.product_images[0]?.url ?? '/images/product-sunscreen.jpg'}
					alt={product.name}
					class="max-h-full max-w-full rounded-[6px] object-contain"
				/>
			</div>
			<div class="flex-1">
				<div class="serif text-base font-medium text-ink">{product.name}</div>
				<div class="text-xs text-muted">
					{product.categories?.name} ·
					{#if product.product_variants.length}
						{formatPrice(Math.min(...product.product_variants.map((v) => v.price)))}–{formatPrice(
							Math.max(...product.product_variants.map((v) => v.price))
						)}
						· Stock {product.product_variants.reduce((s, v) => s + v.stock, 0)}
					{:else}
						No sizes yet
					{/if}
				</div>
				<span class="text-xs font-semibold uppercase tracking-wider text-terracotta mt-1 inline-block">{statusLabel[product.status] || product.status}</span>
			</div>
			<div class="flex flex-wrap items-center gap-2 text-sm">
				<button class="text-muted hover:text-ink px-1" onclick={() => move(i, -1)} disabled={i === 0 || searchQuery.length > 0} aria-label="Move up">↑</button>
				<button
					class="text-muted hover:text-ink px-1"
					onclick={() => move(i, 1)}
					disabled={i === filtered.length - 1 || searchQuery.length > 0}
					aria-label="Move down">↓</button
				>
				<a href="/admin/products/{product.id}" class="text-terracotta font-medium hover:underline">Edit</a>
				<button onclick={() => duplicate(product)} class="text-terracotta font-medium hover:underline">Duplicate</button>
				<button onclick={() => toggleHide(product)} class="text-terracotta font-medium hover:underline">
					{product.status === 'hidden' ? 'Restore' : 'Hide'}
				</button>
				<button onclick={() => remove(product)} class="text-terracotta font-medium hover:underline">Delete</button>
			</div>
		</div>
	{:else}
		<p class="text-sm text-placeholder rounded-2xl border border-line bg-white p-8 text-center">No products found matching your search.</p>
	{/each}
</div>
