<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';

	let { children, data }: { children: Snippet; data: { supabase: import('@supabase/supabase-js').SupabaseClient } } =
		$props();

	let showLogoutModal = $state(false);
	let loggingOut = $state(false);

	const links = [
		{ href: '/admin', label: 'Dashboard Overview' },
		{ href: '/admin/products', label: 'Products' },
		{ href: '/admin/orders', label: 'Orders' },
		{ href: '/admin/customers', label: 'Customers' },
		{ href: '/admin/analytics', label: 'Analytics' },
		{ href: '/admin/categories', label: 'Categories' },
		{ href: '/admin/settings', label: 'Settings' }
	];

	async function confirmLogout() {
		loggingOut = true;
		cart.resetOnLogout();
		await data.supabase.auth.signOut();
		await invalidateAll();
		showLogoutModal = false;
		loggingOut = false;
		goto('/admin-login');
	}
</script>

<div class="min-h-screen bg-cream">
	<header class="border-b border-line bg-white sticky top-0 z-40 shadow-xs">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
			<a href="/admin" class="flex items-center gap-2">
				<img src="/images/logo.png" alt="Naidile Naturals" class="h-8 w-8 rounded-full" />
				<span class="serif text-base font-medium text-ink">Naidile Naturals Admin Portal</span>
			</a>
			<button
				class="rounded-xl border border-terracotta/30 bg-terracotta/5 px-3.5 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta hover:text-white transition"
				onclick={() => (showLogoutModal = true)}
			>
				Log Out
			</button>
		</div>
		<nav class="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5 pb-2.5 text-sm">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="rounded-full px-3.5 py-1.5 whitespace-nowrap transition font-medium {page.url.pathname === link.href
						? 'bg-olive-deep text-white shadow-xs'
						: 'text-ink hover:bg-stone-100'}"
				>
					{link.label}
				</a>
			{/each}
		</nav>
	</header>

	<main class="mx-auto max-w-5xl px-5 py-6">
		{@render children()}
	</main>
</div>

<!-- Logout Confirmation Modal -->
{#if showLogoutModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
		<div class="w-full max-w-sm rounded-[24px] border border-line bg-white p-6 shadow-2xl text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10 text-xl text-terracotta">
				🔒
			</div>
			<h3 class="serif mt-4 text-xl font-medium text-ink">Logout Confirmation</h3>
			<p class="mt-2 text-xs text-muted">Are you sure you want to log out of the Admin Management Portal?</p>

			<div class="mt-6 flex gap-3">
				<button
					type="button"
					onclick={() => (showLogoutModal = false)}
					disabled={loggingOut}
					class="w-full rounded-xl border border-line bg-stone-50 py-2.5 text-sm font-medium text-ink hover:bg-stone-100 transition"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmLogout}
					disabled={loggingOut}
					class="w-full rounded-xl bg-terracotta py-2.5 text-sm font-medium text-white hover:opacity-90 transition shadow-sm"
				>
					{loggingOut ? 'Logging out…' : 'Logout'}
				</button>
			</div>
		</div>
	</div>
{/if}
