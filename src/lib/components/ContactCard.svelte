<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon,
		title,
		sub,
		linkText,
		linkHref
	}: {
		icon: Snippet;
		title: string;
		sub?: string;
		linkText?: string;
		linkHref?: string;
	} = $props();
</script>

<div class="flex items-center gap-4 rounded-2xl border border-line bg-cream-deep p-4 hover:border-olive-deep/40 transition-colors duration-200">
	<span
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive-deep text-white"
	>
		{@render icon()}
	</span>
	<div class="flex flex-col gap-0.5">
		<span class="serif text-[0.95rem]">{title}</span>
		{#if sub}<span class="text-xs text-muted">{sub}</span>{/if}
		{#if linkText && linkHref}
			<a
				href={linkHref}
				target={linkHref.startsWith('http') ? '_blank' : undefined}
				rel={linkHref.startsWith('http') ? 'noopener' : undefined}
				class="text-xs text-terracotta">{linkText}</a
			>
		{/if}
	</div>
</div>
