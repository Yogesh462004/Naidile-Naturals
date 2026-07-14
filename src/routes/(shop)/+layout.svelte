<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import AppShell from '$lib/components/AppShell.svelte';

	let { children, data } = $props();

	onMount(() => {
		const channel = data.supabase
			.channel('categories-changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
				invalidate('supabase:db:categories');
			})
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	});
</script>

<AppShell categories={data.categories}>
	{@render children()}
</AppShell>
