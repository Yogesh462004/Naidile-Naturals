<script lang="ts">
	import { formatPrice } from '$lib/utils/format';
	import type { ProductVariant } from '$lib/supabase/types';

	let {
		variants,
		selected = $bindable(),
		onselect
	}: {
		variants: ProductVariant[];
		selected: ProductVariant;
		onselect?: (v: ProductVariant) => void;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	{#each variants as v (v.id)}
		<button
			type="button"
			disabled={v.stock <= 0}
			onclick={() => {
				selected = v;
				onselect?.(v);
			}}
			class="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 {selected.id ===
			v.id
				? 'border-terracotta bg-[#fbf2ed]'
				: 'border-line bg-white'}"
		>
			<span class="flex items-center gap-2.5">
				<span
					class="flex h-4 w-4 items-center justify-center rounded-full border-2 {selected.id === v.id
						? 'border-terracotta'
						: 'border-line'}"
				>
					{#if selected.id === v.id}<span class="h-2 w-2 rounded-full bg-terracotta"></span>{/if}
				</span>
				<span class="text-sm">{v.size}{v.stock <= 0 ? ' (Out of stock)' : v.stock <= 10 ? ` (${v.stock} left in stock)` : ''}</span>
			</span>
			<span class="text-sm font-medium">{formatPrice(v.price)}</span>
		</button>
	{/each}
</div>
