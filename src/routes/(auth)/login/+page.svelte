<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import { forgetSessionCookies, signInWithRole } from '$lib/utils/auth';

	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let rememberMe = $state(true);
	let submitting = $state(false);
	let errorMsg = $state('');
	let isAdminAccount = $state(false);

	async function login(e: Event) {
		e.preventDefault();
		submitting = true;
		errorMsg = '';
		isAdminAccount = false;

		const { error, wrongRole } = await signInWithRole(data.supabase, email, password, 'customer');
		if (error) {
			errorMsg = error;
		} else if (wrongRole) {
			errorMsg = 'Admin Account Detected\n\nPlease use the Admin Login page.';
			isAdminAccount = true;
		} else {
			if (!rememberMe) forgetSessionCookies();
			goto(page.url.searchParams.get('next') || '/');
		}
		submitting = false;
	}
</script>

<svelte:head>
	<title>Customer Login — Naidile Naturals</title>
</svelte:head>

<div class="mx-auto max-w-md">
	<h1 class="text-center text-2xl font-medium serif text-ink">Welcome Back</h1>
	<p class="mt-1 text-center text-xs text-muted">
		Log in to view your cart, saved addresses, and previous orders
	</p>

	<form class="mt-6 flex flex-col gap-4" onsubmit={login}>
		<label class="flex flex-col gap-1 text-sm text-ink">
			Email
			<input
				bind:value={email}
				required
				type="email"
				autocomplete="email"
				placeholder="you@example.com"
				class="rounded-xl border border-line px-4 py-3 focus:border-gold focus:outline-none"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm text-ink">
			Password
			<div class="relative flex items-center">
				<input
					bind:value={password}
					required
					type={showPassword ? 'text' : 'password'}
					autocomplete="current-password"
					placeholder="Enter your password"
					class="w-full rounded-xl border border-line px-4 py-3 pr-11 focus:border-gold focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => (showPassword = !showPassword)}
					class="absolute right-3.5 text-muted hover:text-ink transition focus:outline-none cursor-pointer"
					aria-label={showPassword ? 'Hide password' : 'Show password'}
				>
					{#if showPassword}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round" stroke-linejoin="round" />
							<line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					{:else}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					{/if}
				</button>
			</div>
		</label>

		<div class="flex items-center justify-between text-sm">
			<label class="flex items-center gap-2 text-muted">
				<input type="checkbox" bind:checked={rememberMe} class="rounded border-line" />
				Remember me
			</label>
			<a href="/forgot-password" class="text-terracotta hover:underline">Forgot password?</a>
		</div>

		{#if errorMsg}
			<div class="rounded-xl border border-terracotta/30 bg-terracotta/5 p-4 text-sm text-terracotta whitespace-pre-line" role="alert" aria-live="polite">
				<div class="font-medium">{errorMsg}</div>
				{#if isAdminAccount}
					<div class="mt-3">
						<a
							href="/admin-login"
							class="block w-full rounded-lg bg-terracotta px-4 py-2 text-center text-white font-medium hover:opacity-90 transition"
						>
							Go to Admin Login
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<Button type="submit" variant="terracotta" disabled={submitting}>
			{submitting ? 'Authenticating…' : 'Log In with Email'}
		</Button>
	</form>

	<p class="mt-5 text-center text-sm text-muted">
		New here? <a href="/signup" class="text-terracotta hover:underline font-medium">Create an account</a>
	</p>
</div>
