<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import './layout.css';

	let { children, data } = $props();

	onMount(() => {
		if (data.session?.user?.id) {
			cart.syncWithServer(data.supabase, data.session.user.id);
		}

		const { data: sub } = data.supabase.auth.onAuthStateChange((event, newSession) => {
			if (newSession?.user?.id) {
				cart.syncWithServer(data.supabase, newSession.user.id);
			} else if (event === 'SIGNED_OUT' || !newSession) {
				cart.resetOnLogout();
			} else {
				cart.clearServerSync();
			}
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => sub.subscription.unsubscribe();
	});
</script>

<svelte:head><link rel="icon" href="/favicon.png" type="image/png" /></svelte:head>
{@render children()}
