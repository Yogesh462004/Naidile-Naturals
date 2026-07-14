<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	let step = $state<'email' | 'verify' | 'done'>('email');
	let email = $state('');
	let otpInput = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);

	let submitting = $state(false);
	let errorMsg = $state('');

	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-=+~`';/\\\[\]]).{8,}$/;

	async function submitEmail(e?: Event) {
		if (e) e.preventDefault();
		errorMsg = '';
		otpInput = '';
		newPassword = '';
		confirmPassword = '';
		if (!email.trim()) {
			errorMsg = 'Please enter your email address.';
			return;
		}
		submitting = true;

		try {
			const res = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const result = await res.json();

			if (!res.ok || result.error) {
				errorMsg = result.error || 'Failed to send verification code.';
				submitting = false;
				return;
			}

			step = 'verify';
		} catch (err: any) {
			errorMsg = err.message || 'Network error occurred.';
		} finally {
			submitting = false;
		}
	}

	async function submitReset(e: Event) {
		e.preventDefault();
		errorMsg = '';

		if (!otpInput.trim() || otpInput.trim().length !== 6) {
			errorMsg = 'Please enter the 6-digit verification code.';
			return;
		}
		if (!passwordPattern.test(newPassword)) {
			errorMsg = 'New password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character (e.g., Mohan@123 or VibodhAi@2026).';
			return;
		}
		if (newPassword !== confirmPassword) {
			errorMsg = 'Passwords do not match.';
			return;
		}

		submitting = true;

		try {
			const res = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email.trim(),
					otpCode: otpInput.trim(),
					password: newPassword
				})
			});

			const result = await res.json();

			if (!res.ok || result.error) {
				errorMsg = result.error || 'Failed to verify code and reset password.';
				submitting = false;
				return;
			}

			step = 'done';
			setTimeout(() => goto('/login'), 2000);
		} catch (err: any) {
			errorMsg = err.message || 'Network error occurred.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password — Naidile Naturals</title>
</svelte:head>

<div class="mb-4 text-left">
	<a href="/login" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Login
	</a>
</div>

{#if step === 'done'}
	<div class="text-center py-6 animate-fade-in" role="status" aria-live="polite">
		<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-olive-deep/10 text-2xl">
			🎉
		</div>
		<h1 class="serif text-2xl font-medium text-ink">Password Updated!</h1>
		<p class="mt-2 text-sm text-muted">Your password has been changed successfully. Redirecting you to log in…</p>
	</div>
{:else if step === 'verify'}
	<h1 class="text-center serif text-2xl font-medium text-ink">Enter Verification Code</h1>
	<p class="mt-2 text-center text-sm text-muted leading-relaxed">
		We sent a verification email to <strong class="text-ink">{email}</strong>.<br />
		Enter your 6-digit code below OR click the Reset Password link in your email.
	</p>

	<form class="mt-6 flex flex-col gap-4 animate-fade-in" onsubmit={submitReset}>
		<label class="flex flex-col gap-1 text-sm font-medium text-ink">
			6-Digit Verification Code
			<input
				bind:value={otpInput}
				required
				type="text"
				maxlength="6"
				placeholder="123456"
				class="rounded-xl border border-line px-4 py-3 font-mono text-lg tracking-widest text-center focus:border-terracotta focus:outline-none"
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm font-medium text-ink">
			New Password
			<div class="relative flex items-center">
				<input
					bind:value={newPassword}
					required
					type={showNewPassword ? 'text' : 'password'}
					placeholder="e.g. Mohan@123"
					class="w-full rounded-xl border border-line px-4 py-3 pr-11 focus:border-terracotta focus:outline-none"
				/>
				<button
					type="button"
					onclick={() => (showNewPassword = !showNewPassword)}
					class="absolute right-3.5 text-muted hover:text-ink transition focus:outline-none cursor-pointer"
					aria-label={showNewPassword ? 'Hide password' : 'Show password'}
				>
					{#if showNewPassword}
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

		<label class="flex flex-col gap-1 text-sm font-medium text-ink">
			Confirm New Password
			<div class="relative flex items-center">
				<input
					bind:value={confirmPassword}
					required
					type={showConfirmPassword ? 'text' : 'password'}
					placeholder="Re-enter password"
					class="w-full rounded-xl border border-line px-4 py-3 pr-11 focus:border-terracotta focus:outline-none"
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

		{#if errorMsg}
			<div class="rounded-xl bg-terracotta/10 p-3 text-sm font-medium text-terracotta" role="alert" aria-live="polite">
				⚠️ {errorMsg}
			</div>
		{/if}

		<Button type="submit" variant="terracotta" disabled={submitting} class="py-3.5 mt-1">
			{submitting ? 'Verifying & Updating…' : 'Verify Code & Reset Password'}
		</Button>
	</form>

	<div class="mt-5 flex items-center justify-between text-xs text-muted border-t border-line/60 pt-4">
		<button
			type="button"
			onclick={() => (step = 'email')}
			class="hover:text-ink underline transition-colors"
		>
			&larr; Change Email Address
		</button>
		<button
			type="button"
			disabled={submitting}
			onclick={() => submitEmail()}
			class="text-terracotta hover:underline font-medium transition-colors"
		>
			Resend Verification Code
		</button>
	</div>
{:else}
	<h1 class="text-center serif text-2xl font-medium text-ink">Forgot Your Password?</h1>
	<p class="mt-2 text-center text-sm text-muted">
		Enter your email and we'll send you a 6-digit verification code to reset your password.
	</p>

	<form class="mt-6 flex flex-col gap-4 animate-fade-in" onsubmit={submitEmail}>
		<label class="flex flex-col gap-1 text-sm font-medium text-ink">
			Email Address
			<input
				bind:value={email}
				required
				type="email"
				autocomplete="email"
				placeholder="name@example.com"
				class="rounded-xl border border-line px-4 py-3 focus:border-terracotta focus:outline-none"
			/>
		</label>

		{#if errorMsg}
			<div class="rounded-xl bg-terracotta/10 p-3 text-sm font-medium text-terracotta" role="alert" aria-live="polite">
				⚠️ {errorMsg}
			</div>
		{/if}

		<Button type="submit" variant="terracotta" disabled={submitting} class="py-3.5 mt-1">
			{submitting ? 'Sending Code…' : 'Send Verification Code'}
		</Button>
	</form>

	<p class="mt-5 text-center text-sm text-muted">
		Remember your password? <a href="/login" class="text-terracotta font-medium hover:underline">Log in here</a>
	</p>
{/if}
