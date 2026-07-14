<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	let fullName = $state('');
	let email = $state('');
	let mobileNumber = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let submitting = $state(false);
	let errorMsg = $state('');
	let sent = $state(false);
	let autoConfirmed = $state(false);
	let autoConfirmMsg = $state('');

	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-=+~`';/\\\[\]]).{8,}$/;

	async function signup(e: Event) {
		e.preventDefault();
		errorMsg = '';

		if (!mobileNumber.trim()) {
			errorMsg = 'Mobile Number is required.';
			return;
		}

		const cleanPhone10 = mobileNumber.replace(/[^\d]/g, '').slice(-10);
		if (cleanPhone10.length !== 10) {
			errorMsg = 'Please enter a valid 10-digit mobile number.';
			return;
		}
		const formattedPhone = `+91${cleanPhone10}`;

		if (!passwordPattern.test(password)) {
			errorMsg = 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character (e.g., Mohan@123 or VibodhAi@2026).';
			return;
		}
		if (password !== confirmPassword) {
			errorMsg = 'Passwords do not match.';
			return;
		}

		submitting = true;

		// Step 1: Check if email or mobile number already exists
		try {
			const checkRes = await fetch('/api/auth/check-duplicate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), phone: formattedPhone })
			});
			const checkData = await checkRes.json();
			if (checkData.exists) {
				errorMsg = checkData.message;
				submitting = false;
				return;
			}
		} catch (err) {
			console.error('Duplicate check error:', err);
		}

		// Step 2: Proceed with new customer registration via our Resend + admin API
		try {
			const res = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email.trim(),
					password,
					fullName: fullName.trim(),
					phone: formattedPhone
				})
			});
			const result = await res.json();

			if (!res.ok || result.error) {
				errorMsg = result.error || 'Failed to create customer account.';
				submitting = false;
				return;
			}

			if (result.autoConfirmed) {
				autoConfirmed = true;
				autoConfirmMsg = result.message;
			}
			sent = true;
		} catch (err: any) {
			errorMsg = err.message || 'An unexpected network error occurred.';
			submitting = false;
			return;
		}
	}
</script>

<svelte:head>
	<title>Customer Sign Up — Naidile Naturals</title>
</svelte:head>

<div class="mx-auto max-w-md">
	{#if sent}
		<div class="rounded-2xl border border-line bg-white p-8 text-center shadow-card" role="status" aria-live="polite">
			{#if autoConfirmed}
				<span class="text-4xl">🎉</span>
				<h1 class="mt-3 serif text-2xl font-medium text-ink">Account Verified!</h1>
				<p class="mt-3 text-sm text-body">
					{autoConfirmMsg || 'Your customer account has been created and verified! You can now log into your account directly.'}
				</p>
				<div class="mt-6">
					<a href="/login" class="inline-block rounded-xl bg-terracotta px-6 py-3 font-medium text-white shadow-soft transition hover:bg-terracotta-dark">Go to Customer Login →</a>
				</div>
			{:else}
				<span class="text-4xl">✉️</span>
				<h1 class="mt-3 serif text-2xl font-medium text-ink">Check Your Email</h1>
				<p class="mt-3 text-sm text-body">
					We've sent a confirmation link to <strong>{email}</strong>. Verify your email address to activate your customer account.
				</p>
				<div class="mt-6">
					<a href="/login" class="text-sm font-medium text-terracotta hover:underline">← Back to Login</a>
				</div>
			{/if}
		</div>
	{:else}
		<h1 class="text-center serif text-2xl font-medium text-ink">Create Customer Account</h1>
		<p class="mt-1 text-center text-xs text-muted">
			Sign up to browse herbal essentials, save addresses, and place WhatsApp orders
		</p>

		<form class="mt-6 flex flex-col gap-4" onsubmit={signup}>
			<label class="flex flex-col gap-1 text-sm text-ink">
				Full Name
				<input
					bind:value={fullName}
					required
					type="text"
					autocomplete="name"
					placeholder="e.g. Anitha Gowda"
					class="rounded-xl border border-line px-4 py-3 focus:border-gold focus:outline-none"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm text-ink">
				Email Address
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
				Mobile Number <span class="text-terracotta">*</span>
				<div class="flex items-center gap-2">
					<span class="rounded-xl border border-line bg-stone-100 px-3.5 py-3 text-sm font-medium text-muted">+91</span>
					<input
						bind:value={mobileNumber}
						required
						type="tel"
						inputmode="numeric"
						maxlength="10"
						autocomplete="tel"
						placeholder="9876543210"
						class="flex-1 rounded-xl border border-line px-4 py-3 focus:border-gold focus:outline-none"
					/>
				</div>
			</label>
			<label class="flex flex-col gap-1 text-sm text-ink">
				Password
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
			<label class="flex flex-col gap-1 text-sm text-ink">
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

			{#if errorMsg}
				<div class="rounded-xl border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta font-medium" role="alert" aria-live="polite">
					{errorMsg}
				</div>
			{/if}

			<Button type="submit" variant="terracotta" disabled={submitting}>
				{submitting ? 'Creating account…' : 'Sign Up as Customer'}
			</Button>
		</form>

		<p class="mt-5 text-center text-sm text-muted">
			Already have an account? <a href="/login" class="text-terracotta hover:underline font-medium">Log in here</a>
		</p>
	{/if}
</div>
