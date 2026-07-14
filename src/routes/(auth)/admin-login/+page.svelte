<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import { forgetSessionCookies, signInWithRole } from '$lib/utils/auth';

	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(true);
	let submitting = $state(false);
	let errorMsg = $state('');
	let isCustomerAccount = $state(false);

	async function login(e: Event) {
		e.preventDefault();
		submitting = true;
		errorMsg = '';
		isCustomerAccount = false;

		const { error, wrongRole } = await signInWithRole(data.supabase, email, password, 'admin');
		if (error) {
			errorMsg = error;
		} else if (wrongRole) {
			errorMsg = 'Access Denied\n\nThis account is registered as a Customer.\n\nPlease use the Customer Login page.';
			isCustomerAccount = true;
		} else {
			if (!rememberMe) forgetSessionCookies();
			goto(page.url.searchParams.get('next') || '/admin');
		}
		submitting = false;
	}
</script>

<svelte:head>
	<title>Admin Login — Naidile Naturals</title>
</svelte:head>

<div class="mx-auto max-w-md">
	<h1 class="text-center text-2xl font-medium serif text-ink">🛡️ Admin Portal Login</h1>
	<p class="mt-1 text-center text-xs text-muted">Authorized management staff and administrator login</p>

	<form class="mt-6 flex flex-col gap-4" onsubmit={login}>
		<label class="flex flex-col gap-1 text-sm text-ink">
			Email
			<input
				bind:value={email}
				required
				type="email"
				autocomplete="email"
				placeholder="admin@naidilenaturals.com"
				class="rounded-xl border border-line px-4 py-3 focus:border-gold focus:outline-none"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm text-ink">
			Password
			<input
				bind:value={password}
				required
				type="password"
				autocomplete="current-password"
				class="rounded-xl border border-line px-4 py-3 focus:border-gold focus:outline-none"
			/>
		</label>

		<label class="flex items-center gap-2 text-sm text-muted">
			<input type="checkbox" bind:checked={rememberMe} class="rounded border-line" />
			Remember me
		</label>

		{#if errorMsg}
			<div class="rounded-xl border border-terracotta/30 bg-terracotta/5 p-4 text-sm text-terracotta whitespace-pre-line" role="alert" aria-live="polite">
				<div class="font-medium">{errorMsg}</div>
				{#if isCustomerAccount}
					<div class="mt-3">
						<a
							href="/login"
							class="block w-full rounded-lg bg-terracotta px-4 py-2 text-center text-white font-medium hover:opacity-90 transition"
						>
							Go to Customer Login
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<Button type="submit" variant="terracotta" disabled={submitting}>
			{submitting ? 'Authenticating…' : 'Log In to Admin Portal'}
		</Button>
	</form>
</div>
