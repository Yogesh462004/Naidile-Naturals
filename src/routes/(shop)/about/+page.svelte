<script lang="ts">
	import FrameHero from '$lib/components/FrameHero.svelte';
	import FounderCard from '$lib/components/FounderCard.svelte';
	import ValueCard from '$lib/components/ValueCard.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
</script>

<svelte:head>
	<title>About Us — Naidile Naturals</title>
	<meta
		name="description"
		content="For every age. No gender bar. The story and philosophy behind Naidile Naturals."
	/>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Home
	</a>
</div>

<Breadcrumb items={[{ label: 'About Us' }]} />

<div class="animate-fade-in">
	<FrameHero compact floral eyebrow="About Us">For every age. No gender bar.</FrameHero>

	<section class="border-t border-line px-5 py-[26px]">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
			<div class="space-y-4">
				<p class="text-[0.94rem] text-body">
					We have curated these products to suit all age with gender no bar.
				</p>

				<FounderCard>
					<span class="serif text-[0.95rem] text-olive-deep">The Hands Behind the Formulas</span>
					<p>
						Being an MTech holder in Biomedical Engineering, changed field to certified Nutritionist,
						and now a student of Ayurveda — we thrive to give quality products without any
						compromise, while choosing the quality of raw material as well.
					</p>
					<div class="mt-1 flex flex-wrap gap-2 text-xs text-terracotta">
						<span>MTech, Biomedical Engg &rarr;</span>
						<span>Certified Nutritionist &rarr;</span>
						<span>Student of Ayurveda</span>
					</div>
				</FounderCard>
			</div>

			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-3">
					<ValueCard icon="👶" title="All Ages" sub="Gentle formulations" />
					<ValueCard icon="⚧" title="No Gender Bar" sub="For everyone" />
				</div>

				<div class="rounded-2xl border border-line bg-cream p-5 text-center flex flex-col items-center">
					<span class="text-xl mb-1">🌿</span>
					<h3 class="serif text-[1rem] text-ink mb-1.5">Discover Natural Wellness</h3>
					<p class="text-xs text-muted mb-4 max-w-xs">Explore our toxin-free personal care range, crafted with raw, unrefined whole plants.</p>
					<a href="/shop" class="inline-block rounded-full bg-olive-deep text-white text-xs font-semibold px-5 py-2.5 uppercase tracking-wider hover:opacity-90 transition">
						Shop the Collection
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
