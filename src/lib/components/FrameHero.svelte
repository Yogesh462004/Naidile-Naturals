<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		compact = false,
		floral = true,
		eyebrow,
		showBrandRow = false,
		children,
		cta
	}: {
		compact?: boolean;
		floral?: boolean;
		eyebrow?: string;
		showBrandRow?: boolean;
		children: Snippet;
		cta?: Snippet;
	} = $props();

	let aspect = $derived(compact ? (floral ? '1280/480' : '1280/520') : floral ? '1000/417' : '1280/698');
</script>

<div
	class="relative mx-3.5 mt-3.5 overflow-hidden rounded-[18px] bg-cover bg-center"
	style="aspect-ratio:{aspect}; background-image:url('/images/hero-floral.jpg'); max-height:70vh; min-height:40vh;"
>
	<div
		class="absolute inset-0 {floral
			? 'bg-gradient-to-b from-[rgba(6,38,38,0.18)] to-[rgba(6,38,38,0.05)]'
			: 'bg-gradient-to-b from-[rgba(4,14,22,0.55)] via-[rgba(4,14,22,0.15)] to-[rgba(4,14,22,0.05)]'} z-0"
	></div>
	<div class="relative z-10 flex h-full flex-col justify-center p-5 items-center text-center">
		{#if showBrandRow}
			<div class="mb-2 flex flex-col items-center gap-2">
				<img
					src="/images/logo.png"
					alt="Naidile Naturals"
					class="h-16 w-16 rounded-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.25)]"
				/>
				<span
					class="eyebrow tracking-widest bg-gradient-to-r from-[#D98A3A] via-[#F5C38B] to-[#D98A3A] bg-clip-text text-transparent font-bold"
					>Naidile Naturals</span
				>
			</div>
		{:else if eyebrow}
			<span
				class="eyebrow mb-1.5 bg-gradient-to-r from-[#D98A3A] via-[#F5C38B] to-[#D98A3A] bg-clip-text text-transparent font-bold"
				>{eyebrow}</span
			>
		{/if}
		<h1
			class="text-[#f7fbfc] leading-tight max-w-3xl"
			style="text-shadow:0 3px 18px rgba(0,0,0,0.55); margin:0; font-size:{compact ? '1.15rem' : '1.5rem'};"
		>
			{@render children()}
		</h1>

		{#if cta}
			<div class="mt-6">
				{@render cta()}
			</div>
		{:else}
			<div class="mt-6">
				<a
					href="/shop"
					class="inline-block rounded-full py-3.5 px-6 text-[0.85rem] font-medium tracking-[0.08em] uppercase bg-olive-deep text-white transition-transform duration-200 transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-olive-deep/40"
					aria-label="Explore products"
				>
					Explore Products
				</a>
			</div>
		{/if}
	</div>
</div>
