<script lang="ts">
	let {
		icon,
		title,
		sub,
		onclick
	}: {
		icon: string;
		title: string;
		sub?: string;
		onclick?: () => void;
	} = $props();
</script>

<button
	{onclick}
	class="group flex flex-col items-center gap-1.5 rounded-[14px] border border-line bg-cream-deep p-4 text-center shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-olive-deep/30 {onclick
		? 'cursor-pointer transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-md'
		: 'cursor-default'}"
>
	<span class="text-2xl {onclick ? 'transform transition-transform duration-200 group-hover:scale-105' : ''}">{icon}</span>
	<span class="serif text-[0.95rem]">{title}</span>
	{#if sub}
		<span class="text-xs text-muted">{sub}</span>
	{/if}
	{#if onclick}
		<span class="mt-2 text-xs text-olive-deep opacity-0 group-hover:opacity-100 transition-opacity duration-200">
			Explore &rarr;
		</span>
	{/if}
</button>
