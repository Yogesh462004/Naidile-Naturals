<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let submitting = $state(false);
	let errorMsg = $state('');
	let done = $state(false);

	let parsedAccessToken = $state('');
	let parsedRefreshToken = $state('');

	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-=+~`';/\\\[\]]).{8,}$/;

	onMount(async () => {
		// Parse access_token from URL hash (#access_token=...&refresh_token=...)
		if (window.location.hash) {
			const hash = window.location.hash.substring(1);
			const params = new URLSearchParams(hash);
			const accessToken = params.get('access_token');
			const refreshToken = params.get('refresh_token');

			if (accessToken) {
				parsedAccessToken = accessToken;
				if (refreshToken) parsedRefreshToken = refreshToken;

				try {
					await data.supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken || ''
					});
				} catch (e) {
					console.warn('Set session warning:', e);
				}
			}
		}

		// Also check search params (?access_token=... or ?code=...)
		const queryParams = new URLSearchParams(window.location.search);
		const accessTokenQuery = queryParams.get('access_token') || queryParams.get('token');
		if (accessTokenQuery && !parsedAccessToken) {
			parsedAccessToken = accessTokenQuery;
		}
	});

	async function submit(e: Event) {
		e.preventDefault();
		errorMsg = '';

		if (!passwordPattern.test(password)) {
			errorMsg = 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character (e.g., Mohan@123 or VibodhAi@2026).';
			return;
		}
		if (password !== confirmPassword) {
			errorMsg = 'Passwords do not match.';
			return;
		}

		submitting = true;

		try {
			// First, try updating via our rock-solid backend endpoint if we have parsed or session token
			let sessionToken = parsedAccessToken;
			if (!sessionToken) {
				const { data: sData } = await data.supabase.auth.getSession();
				if (sData?.session?.access_token) {
					sessionToken = sData.session.access_token;
				}
			}

			if (sessionToken) {
				const res = await fetch('/api/auth/reset-password', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						password,
						accessToken: sessionToken,
						refreshToken: parsedRefreshToken
					})
				});

				const result = await res.json();
				if (res.ok && result.success) {
					done = true;
					setTimeout(() => goto('/login'), 2000);
					return;
				}
			}

			// Fallback: try client-side updateUser directly
			const { error } = await data.supabase.auth.updateUser({ password });

			if (error) {
				errorMsg = error.message;
				submitting = false;
				return;
			}

			done = true;
			setTimeout(() => goto('/login'), 2000);
		} catch (err: any) {
			errorMsg = err.message || 'Failed to update password.';
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password — Naidile Naturals</title>
</svelte:head>

<div class="mb-4 text-left">
	<a href="/login" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Login
	</a>
</div>

{#if done}
	<div class="text-center" role="status" aria-live="polite">
		<h1 class="text-2xl">Password Updated</h1>
		<p class="mt-3 text-sm text-muted">Redirecting you to log in…</p>
	</div>
{:else}
	<h1 class="text-center text-2xl">Set a New Password</h1>

	<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
		<label class="flex flex-col gap-1 text-sm">
			New Password
			<div class="relative flex items-center">
				<input
					bind:value={password}
					required
					type={showPassword ? 'text' : 'password'}
					autocomplete="new-password"
					placeholder="e.g. Mohan@123"
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
			<span class="text-[0.7rem] text-muted">Min 8 chars, uppercase, lowercase, number & special char</span>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Confirm Password
			<div class="relative flex items-center">
				<input
					bind:value={confirmPassword}
					required
					type={showConfirmPassword ? 'text' : 'password'}
					autocomplete="new-password"
					placeholder="Re-enter password"
					class="w-full rounded-xl border border-line px-4 py-3 pr-11 focus:border-gold focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => (showConfirmPassword = !showConfirmPassword)}
					class="absolute right-3.5 text-muted hover:text-ink transition focus:outline-none cursor-pointer"
					aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
				>
					{#if showConfirmPassword}
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

		{#if errorMsg}<p class="text-sm text-terracotta" role="alert" aria-live="polite">{errorMsg}</p>{/if}

		<Button type="submit" variant="terracotta" disabled={submitting}>
			{submitting ? 'Updating…' : 'Update Password'}
		</Button>
	</form>
{/if}
