<script lang="ts">
	let { items }: { items: { label: string; href?: string }[] } = $props();
</script>

<nav aria-label="Breadcrumb" class="px-5 py-3 text-xs text-muted">
	<ol class="flex flex-wrap items-center gap-1.5 list-none p-0 m-0">
		<li>
			<a href="/" class="hover:text-olive-deep transition-colors">Home</a>
		</li>
		{#each items as item, index}
			<li class="flex items-center gap-1.5">
				<span class="text-line select-none">/</span>
				{#if item.href && index < items.length - 1}
					<a href={item.href} class="hover:text-olive-deep transition-colors">{item.label}</a>
				{:else}
					<span class="font-medium text-ink" aria-current="page">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
