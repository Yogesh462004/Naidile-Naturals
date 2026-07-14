<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	let status = $state<'checking' | 'success' | 'error'>('checking');
	let errorMsg = $state('');

	onMount(() => {
		const urlError = page.url.searchParams.get('error_description');
		if (urlError) {
			status = 'error';
			errorMsg = urlError;
			return;
		}

		if (data.session) {
			status = 'success';
			setTimeout(() => goto('/'), 1500);
		} else {
			status = 'error';
			errorMsg = 'This link is invalid or has expired. Please try again.';
		}
	});
</script>

<svelte:head>
	<title>Confirming — Naidile Naturals</title>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center bg-cream px-6 text-center">
	<img src="/images/logo.png" alt="Naidile Naturals" class="mb-4 h-14 w-14 rounded-full" />

	<div role="status" aria-live="polite">
		{#if status === 'checking'}
			<p class="text-sm text-muted">Confirming your email…</p>
		{:else if status === 'success'}
			<h1 class="text-xl">Email Confirmed</h1>
			<p class="mt-2 text-sm text-muted">Taking you to Naidile Naturals…</p>
		{:else}
			<h1 class="text-xl">Something Went Wrong</h1>
			<p class="mt-2 text-sm text-muted">{errorMsg}</p>
			<a href="/login" class="mt-4 text-terracotta">Back to log in</a>
		{/if}
	</div>
</div>
