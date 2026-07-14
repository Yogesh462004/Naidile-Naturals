<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { cart } from '$lib/stores/cart.svelte';

	let { data } = $props();

	let showLogoutModal = $state(false);
	let loggingOut = $state(false);

	async function confirmLogout() {
		loggingOut = true;
		cart.resetOnLogout();
		await data.supabase.auth.signOut();
		await invalidateAll();
		showLogoutModal = false;
		loggingOut = false;
		goto('/login');
	}
</script>

<svelte:head>
	<title>My Account — Naidile Naturals</title>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Home
	</a>
</div>

<Breadcrumb items={[{ label: 'My Account' }]} />

<div class="animate-fade-in mx-auto max-w-2xl px-5 pb-8 pt-2">
	<h1 class="text-2xl">My Account</h1>

	<div class="mt-5 rounded-2xl border border-line bg-cream p-5 shadow-card">
		<div class="flex items-center justify-between">
			<div class="serif text-xl font-medium text-ink">{data.profile?.full_name || data.profile?.name || 'Customer Profile'}</div>
			<span class="rounded-full bg-olive-deep/10 px-3 py-1 text-xs font-semibold text-olive-deep uppercase tracking-wider">
				{data.profile?.role || 'Customer'}
			</span>
		</div>
		<div class="mt-2 flex flex-col gap-1 text-sm text-body">
			<div><span class="text-muted font-medium">Email:</span> {data.profile?.email || data.session?.user?.email}</div>
			{#if data.profile?.mobile_number || data.profile?.phone}
				<div><span class="text-muted font-medium">Mobile Number:</span> {data.profile?.mobile_number || data.profile?.phone}</div>
			{/if}
		</div>
	</div>

	<div class="mt-5 flex flex-col gap-3">
		<a
			href="/account/orders"
			class="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink hover:border-olive-deep"
		>
			My Orders
			<span class="text-terracotta">→</span>
		</a>
		<a
			href="/account/addresses"
			class="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink hover:border-olive-deep"
		>
			Saved Addresses
			<span class="text-terracotta">→</span>
		</a>
	</div>

	<div class="mt-6">
		<Button variant="secondary" onclick={() => (showLogoutModal = true)}>Log Out</Button>
	</div>
</div>

<!-- Logout Confirmation Modal -->
{#if showLogoutModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
		<div class="w-full max-w-sm rounded-[24px] border border-line bg-white p-6 shadow-2xl text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10 text-xl text-terracotta">
				🔒
			</div>
			<h3 class="serif mt-4 text-xl font-medium text-ink">Logout Confirmation</h3>
			<p class="mt-2 text-xs text-muted">Are you sure you want to log out of your Naidile Naturals account?</p>

			<div class="mt-6 flex gap-3">
				<button
					type="button"
					onclick={() => (showLogoutModal = false)}
					disabled={loggingOut}
					class="w-full rounded-xl border border-line bg-stone-50 py-2.5 text-sm font-medium text-ink hover:bg-stone-100 transition cursor-pointer"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmLogout}
					disabled={loggingOut}
					class="w-full rounded-xl bg-terracotta py-2.5 text-sm font-medium text-white hover:opacity-90 transition shadow-sm cursor-pointer"
				>
					{loggingOut ? 'Logging out…' : 'Logout'}
				</button>
			</div>
		</div>
	</div>
{/if}
