<script lang="ts">
	let {
		qty = $bindable(1),
		max,
		onchange
	}: { qty: number; max?: number; onchange?: (qty: number) => void } = $props();

	function change(delta: number) {
		const next = qty + delta;
		if (next < 1) {
			qty = 0;
			onchange?.(0);
			return;
		}
		if (max !== undefined && next > max) {
			return;
		}
		qty = next;
		onchange?.(next);
	}
</script>

<div class="flex items-center gap-3 rounded-full border border-line px-1.5 py-1 bg-white shadow-2xs">
	<button
		type="button"
		aria-label="Decrease quantity"
		class="flex h-7 w-7 items-center justify-center rounded-full text-olive-deep hover:bg-cream transition disabled:opacity-30 disabled:pointer-events-none"
		disabled={qty <= 0}
		onclick={() => change(-1)}>−</button
	>
	<span class="w-5 text-center text-sm font-semibold text-ink">{qty}</span>
	<button
		type="button"
		aria-label="Increase quantity"
		class="flex h-7 w-7 items-center justify-center rounded-full text-olive-deep hover:bg-cream transition disabled:opacity-30 disabled:pointer-events-none"
		disabled={max !== undefined && qty >= max}
		onclick={() => change(1)}>+</button
	>
</div>
