<script lang="ts">
	import FrameHero from '$lib/components/FrameHero.svelte';
	import ValueCard from '$lib/components/ValueCard.svelte';
	import ProductFilterSection from '$lib/components/ProductFilterSection.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
</script>

<svelte:head>
	<title>Naidile Naturals — We CARE for HEALTHY skin & hair</title>
	<meta
		name="description"
		content="Naidile Naturals — whole-plant, toxin-free skin and hair care crafted with pure oils, botanicals and herbal extracts."
	/>
</svelte:head>

<div class="animate-fade-in space-y-6 md:space-y-8">
	<FrameHero floral showBrandRow>We CARE for HEALTHY skin and hair</FrameHero>

	<section class="px-5 pt-2 md:pt-3">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
			<div>
				<span class="eyebrow">Our Philosophy</span>
				<h2 class="text-2xl">Rooted in Earth, Free from Toxins</h2>
				<span class="inline-block rounded-full border border-gold px-3 py-1 text-xs text-olive-deep">
					🌿 Established May 10, 2024
				</span>

				<div class="mt-4 space-y-6">
					<p class="max-w-prose text-[0.94rem] text-body leading-relaxed">
						Naidile Naturals was born from a simple promise: to provide your skin and hair with pure,
						unadulterated nourishment, straight from the earth's cradle.
					</p>

					<blockquote class="max-w-prose border-l-4 border-terracotta pl-4 text-[0.94rem] text-body italic py-3">
						Even our logo represents our core formulation secret — we use only raw, whole‑plant
						ingredients exactly as nature intended.
					</blockquote>

					<p class="max-w-prose text-[0.94rem] text-body leading-relaxed">Because we believe true wellness leaves no room for compromise.</p>

					<p class="max-w-prose text-[0.94rem] text-body leading-relaxed">
						Our entire range of hair and skin care products is crafted entirely without synthetic
						chemicals, artificial fragrances, or harsh preservatives. We rely on the natural potency of
						pure oils, botanicals, and herbal extracts to deliver self‑care that is safe, effective, and
						transformative.
					</p>
				</div>
			</div>

			<div class="flex items-center justify-center">
				<div class="w-full max-w-sm">
					<div class="grid grid-cols-2 gap-3">
						<ValueCard icon="🌱" title="Whole‑Plant" sub="Raw & unrefined" />
						<ValueCard icon="🚫" title="Zero Synthetics" sub="No harsh chemicals" />
						<ValueCard icon="🌾" title="Herbal Extracts" sub="Nature‑potent" />
						<ValueCard icon="💧" title="Pure Oils" sub="Cold & unadulterated" />
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="px-5 pt-2 md:pt-3">
		<span class="eyebrow">Explore</span>
		<h2 class="mt-1 text-2xl">Shop by Category</h2>

		<div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
			{#each data.categories as c (c.slug)}
				<ValueCard icon={c.icon ?? ''} title={c.name} onclick={() => goto(`/category/${c.slug}`)} />
			{/each}
		</div>
	</section>

	<!-- Side-by-Side Flipkart/Zepto Categories & Price Sort Section -->
	<section class="border-t border-line px-5 py-[32px]" id="filter-section">
		<span class="eyebrow">Our Complete Catalog</span>
		<h2 class="mt-1 mb-6 text-2xl">Categories & Products</h2>

		<ProductFilterSection
			products={data.allProducts || data.products || []}
			categories={data.categories || []}
			title="Shop Side by Side"
		/>
	</section>
</div>
