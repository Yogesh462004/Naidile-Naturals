<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import FrameHero from '$lib/components/FrameHero.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import ProductFilterSection from '$lib/components/ProductFilterSection.svelte';

	let { data } = $props();

	const emptyState: Record<string, { icon: string; text: string }> = {
		haircare: {
			icon: '🌾',
			text: "Our hair care range is being crafted with the same raw, whole‑plant care. Reach out on Contact Us to ask about upcoming hair oils & herbal rinses."
		},
		cleansers: {
			icon: '🫧',
			text: 'Natural face and body cleansers are on their way. Message us to be first to know when they launch.'
		},
		purepowders: {
			icon: '🌰',
			text: 'Our herbal powder collection is brewing. Contact us to customise a blend for your skin or hair.'
		},
		skincare: {
			icon: '🌼',
			text: 'More skin care essentials — face oils, body butters & herbal balms — coming soon.'
		}
	};

	onMount(() => {
		const channel = data.supabase
			.channel(`products-${data.category.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'products', filter: `category_id=eq.${data.category.id}` },
				() => invalidate('supabase:db:products')
			)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () =>
				invalidate('supabase:db:products')
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	});
</script>

<svelte:head>
	<title>{data.category.name} — Naidile Naturals</title>
	{#if data.category.subtitle}<meta name="description" content={data.category.subtitle} />{/if}
</svelte:head>

<div class="px-5 pt-3">
	<a href="/shop" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Shop
	</a>
</div>

<Breadcrumb items={[{ label: 'Categories', href: '/shop' }, { label: data.category.name }]} />

<div class="animate-fade-in">
	<FrameHero compact floral eyebrow="{data.category.icon} Category">{data.category.name}</FrameHero>

	{#if data.category.subtitle}
		<p class="border-t border-line px-5 pt-4 text-[0.94rem] text-body">{data.category.subtitle}</p>
	{/if}

	<section class="px-5 py-[26px]">
		<ProductFilterSection
			products={data.allProducts || data.products || []}
			categories={data.categories || []}
			initialCategorySlug={data.category.slug}
			title="{data.category.name} Collection"
			showTitle={false}
		/>

		{#if data.products.length === 0 && emptyState[data.category.slug]}
			<div class="mt-6 rounded-[18px] border border-line bg-cream-deep p-6 text-center">
				<span class="mb-2 block text-3xl">{emptyState[data.category.slug].icon}</span>
				<p class="text-sm text-placeholder">{emptyState[data.category.slug].text}</p>
			</div>
		{/if}
	</section>
</div>
