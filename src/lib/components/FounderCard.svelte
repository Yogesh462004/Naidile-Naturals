<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="flex gap-4 rounded-2xl border border-line bg-cream-deep p-4">
	<div
		class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[1.3rem] text-white"
		style="background:linear-gradient(135deg, var(--color-olive), var(--color-gold))"
	>
		N
	</div>
	<div class="flex flex-col gap-1.5 text-sm text-body">
		{@render children()}
	</div>
</div>
