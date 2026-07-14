<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice } from '$lib/utils/format';
	import Toast from './Toast.svelte';
	import QtyStepper from './QtyStepper.svelte';
	import type { Category } from '$lib/supabase/types';

	let { children, categories = [] }: { children: Snippet; categories?: Category[] } = $props();
	const session = $derived(page.data.session);
	const profile = $derived(page.data.profile);

	let menuOpen = $state(false);
	let searchOpen = $state(false);
	let cartOpen = $state(false);
	let searchInput: HTMLInputElement | undefined = $state();
	let query = $state('');

	function toggleMenu() {
		menuOpen = !menuOpen;
		searchOpen = false;
	}

	function toggleSearch() {
		searchOpen = !searchOpen;
		menuOpen = false;
		if (searchOpen) setTimeout(() => searchInput?.focus(), 200);
	}

	function submitSearch(e: Event) {
		e.preventDefault();
		if (query.trim()) goto(`/search?q=${encodeURIComponent(query.trim())}`);
	}

	function isActiveCategory(slug: string) {
		return page.url.pathname === `/category/${slug}`;
	}
</script>

<svelte:window onclick={() => (menuOpen = false)} />

<div class="mx-auto min-h-screen max-w-[480px] bg-cream pb-8 sm:max-w-[640px] md:max-w-[860px] lg:max-w-[1080px]">
	<header
		class="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-[rgba(248,244,232,0.96)] px-4 py-2.5 backdrop-blur-[8px]"
	>
		<button
			aria-label="Menu"
			class="flex h-[38px] w-[38px] items-center justify-center text-olive-deep"
			onclick={(e) => {
				e.stopPropagation();
				toggleMenu();
			}}
		>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
				<path d="M3 6h18M3 12h18M3 18h18" stroke-linecap="round" />
			</svg>
		</button>

		<a href="/" class="flex items-center gap-2">
			<img src="/images/logo.png" alt="Naidile Naturals" class="h-9 w-9 rounded-full" />
			<span class="flex flex-col leading-tight">
				<span class="serif text-[1rem]">Naidile Naturals</span>
				<span class="text-[0.62rem] text-muted">We CARE for HEALTHY skin &amp; hair</span>
			</span>
		</a>

		<div class="flex items-center gap-1">
			<button
				aria-label="Search"
				class="flex h-[38px] w-[38px] items-center justify-center text-olive-deep"
				onclick={(e) => {
					e.stopPropagation();
					toggleSearch();
				}}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					<circle cx="11" cy="11" r="7" />
					<path d="m20 20-3.5-3.5" stroke-linecap="round" />
				</svg>
			</button>
			<a
				href={session ? (profile?.role === 'admin' ? '/admin' : '/account') : '/login'}
				aria-label="Account"
				class="flex h-[38px] w-[38px] items-center justify-center text-olive-deep"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</a>
			<button
				aria-label="Cart"
				class="relative flex h-[38px] w-[38px] items-center justify-center text-olive-deep"
				onclick={(e) => {
					e.stopPropagation();
					cartOpen = true;
				}}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M4 6h2l1.5 11h11L20 8H7" stroke-linecap="round" stroke-linejoin="round" />
					<circle cx="9.5" cy="20" r="1.4" />
					<circle cx="17.5" cy="20" r="1.4" />
				</svg>
				{#if cart.totalQty > 0}
					<span
						class="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[0.62rem] text-white"
						>{cart.totalQty}</span
					>
				{/if}
			</button>
		</div>

		{#if menuOpen}
			<nav
				class="absolute top-16 left-3 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-white shadow-card"
				transition:scale={{ duration: 180, start: 0.92 }}
			>
				<div class="flex items-center gap-2 bg-cream-deep px-4 py-3">
					<img src="/images/logo.png" alt="Naidile Naturals" class="h-7 w-7 rounded-full" />
					<span class="serif text-sm">Naidile Naturals</span>
				</div>
				<a href="/" class="flex items-center gap-2 border-b border-line px-4 py-3 text-sm">
					<span class="h-1.5 w-1.5 rounded-full bg-gold"></span>Home
				</a>
				<a href="/shop" class="flex items-center gap-2 border-b border-line px-4 py-3 text-sm">
					<span class="h-1.5 w-1.5 rounded-full bg-gold"></span>Shop All
				</a>
				<a href="/about" class="flex items-center gap-2 border-b border-line px-4 py-3 text-sm">
					<span class="h-1.5 w-1.5 rounded-full bg-gold"></span>About Us
				</a>
				<a href="/contact" class="flex items-center gap-2 border-b border-line px-4 py-3 text-sm">
					<span class="h-1.5 w-1.5 rounded-full bg-gold"></span>Contact Us
				</a>
				{#if session}
					<a href="/account" class="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-medium text-olive-deep">
						<span class="h-1.5 w-1.5 rounded-full bg-olive-deep"></span>My Profile &amp; Addresses
					</a>
					{#if profile?.role === 'admin'}
						<a href="/admin" class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-terracotta">
							<span class="h-1.5 w-1.5 rounded-full bg-terracotta"></span>Admin Dashboard
						</a>
					{/if}
				{:else}
					<a href="/login" class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-terracotta">
						<span class="h-1.5 w-1.5 rounded-full bg-terracotta"></span>Login / Register
					</a>
				{/if}
			</nav>
		{/if}
	</header>

	<div
		class="overflow-hidden transition-all duration-[250ms] ease-in-out"
		style="max-height:{searchOpen ? '70px' : '0'}; padding:{searchOpen ? '10px 16px' : '0 16px'}"
	>
		<form onsubmit={submitSearch}>
			<input
				bind:this={searchInput}
				bind:value={query}
				type="text"
				placeholder="Search skin care, hair care, cleansers…"
				aria-label="Search products"
				class="w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
			/>
		</form>
	</div>

	<main>
		{@render children()}
	</main>

	<!-- Fixed bottom category nav removed to avoid duplicating the main 'Shop by Category' section. -->
</div>

{#if cartOpen}
	<button
		type="button"
		aria-label="Close cart"
		class="fixed inset-0 z-[60] block bg-[rgba(58,50,38,0.35)]"
		transition:fade={{ duration: 200 }}
		onclick={() => (cartOpen = false)}
	></button>
	<aside
		class="fixed top-0 right-0 z-[70] flex h-full w-[86%] max-w-[380px] flex-col bg-cream shadow-card"
		transition:fly={{ x: 400, duration: 280 }}
	>
		<div class="flex items-center justify-between border-b border-line px-5 py-4">
			<h3 class="serif text-[1.4rem]">Your Cart</h3>
			<button
				aria-label="Close cart"
				class="-m-2 p-2 text-2xl text-olive-deep"
				onclick={() => (cartOpen = false)}>&times;</button
			>
		</div>
		<div class="flex-1 overflow-y-auto px-5 py-4">
			{#if cart.items.length === 0}
				<div class="mt-10 flex flex-col items-center gap-2 text-center text-sm text-placeholder">
					<span class="text-3xl">🌿</span>
					Your cart is empty.<br />Explore our skin care range to begin.
				</div>
			{:else}
				<div class="flex flex-col gap-4">
					{#each cart.items as item (item.variantId)}
						<div class="flex gap-3">
							{#if item.image}
								<div class="h-16 w-16 rounded-[10px] bg-cream-deep border border-line flex items-center justify-center p-1 overflow-hidden shrink-0">
									<img src={item.image} alt={item.name} class="max-h-full max-w-full rounded-[6px] object-contain" />
								</div>
							{/if}
							<div class="flex flex-1 flex-col justify-center">
								<a href="/product/{item.slug}" class="serif text-sm font-medium text-ink hover:underline" onclick={() => (cartOpen = false)}>{item.name}</a>
								<div class="text-xs text-muted">
									{item.size} · {formatPrice(item.price)} each
								</div>
								<div class="mt-2 flex items-center justify-between gap-2">
									<QtyStepper qty={item.qty} max={item.stock} onchange={(q) => cart.updateQty(item.variantId, q)} />
									<button
										class="text-xs text-terracotta underline font-medium hover:opacity-80"
										onclick={() => cart.remove(item.variantId)}>Remove</button
									>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		{#if cart.items.length > 0}
			<div class="border-t border-line px-5 py-3 text-right text-sm text-ink">
				Total: <span class="serif text-base">{formatPrice(cart.totalPrice)}</span>
			</div>
		{/if}
		<div class="border-t border-line p-4">
			<button
				class="block w-full rounded-full bg-olive-deep py-3.5 text-center text-[0.85rem] font-medium tracking-[0.08em] text-white uppercase"
				onclick={() => {
					cartOpen = false;
					goto('/checkout');
				}}
			>
				Checkout
			</button>
		</div>
	</aside>
{/if}

<Toast />
