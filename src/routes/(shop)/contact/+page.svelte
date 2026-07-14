<script lang="ts">
	import FrameHero from '$lib/components/FrameHero.svelte';
	import ContactCard from '$lib/components/ContactCard.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();
	const s = $derived(data.settings);
</script>

<svelte:head>
	<title>Contact Us — Naidile Naturals</title>
	<meta name="description" content="Connect with Naidile Naturals for queries, orders, or custom formulations." />
</svelte:head>

<div class="px-5 pt-3">
	<a href="/" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Home
	</a>
</div>

<Breadcrumb items={[{ label: 'Contact Us' }]} />

<div class="animate-fade-in">
	<FrameHero compact floral eyebrow="Contact Us">Let's talk skin, hair &amp; herbs</FrameHero>

	<section class="border-t border-line px-5 py-[26px]">
		<p class="max-w-prose text-[0.94rem] text-body">
			Do connect with us for any queries, to order, or to customise any product.
		</p>

		<div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
		{#if s?.business_phone}
			<ContactCard title="Call / WhatsApp" linkText={s.business_phone} linkHref="tel:{s.business_phone}">
				{#snippet icon()}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
						<path
							d="M6 3h3l1.5 4.5L8 9.5a12 12 0 0 0 6.5 6.5l2-2.5L21 15v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z"
						/>
					</svg>
				{/snippet}
			</ContactCard>
		{/if}

		{#if s?.whatsapp_channel_url}
			<ContactCard title="WhatsApp Channel" linkText="Follow our channel →" linkHref={s.whatsapp_channel_url}>
				{#snippet icon()}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
						<path
							d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z"
						/>
					</svg>
				{/snippet}
			</ContactCard>
		{/if}

		{#if s?.instagram_url}
			<ContactCard title="Instagram" linkText="See our latest post →" linkHref={s.instagram_url}>
				{#snippet icon()}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
						<rect x="3" y="3" width="18" height="18" rx="5" />
						<circle cx="12" cy="12" r="4" />
					</svg>
				{/snippet}
			</ContactCard>
		{/if}

		<div class="eyebrow mt-2 md:col-span-2">Join WhatsApp Group</div>

		<ContactCard
			title="Discreet Group — Women"
			linkText="Join the group →"
			linkHref="https://chat.whatsapp.com/JCgOHVMCDYwGD2BMTmPydF"
		>
			{#snippet icon()}
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					<circle cx="12" cy="8" r="3.5" />
					<path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
				</svg>
			{/snippet}
		</ContactCard>

		<ContactCard
			title="Discreet Group — Men"
			linkText="Join the group →"
			linkHref="https://chat.whatsapp.com/FFdFkygfxyDLZl8dNN9cpK"
		>
			{#snippet icon()}
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					<circle cx="12" cy="8" r="3.5" />
					<path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
				</svg>
			{/snippet}
		</ContactCard>

		{#if s?.business_address || s?.business_email}
			<div class="mt-1 text-xs text-muted md:col-span-2">
				{#if s.business_address}<div>{s.business_address}</div>{/if}
				{#if s.business_email}<div>{s.business_email}</div>{/if}
			</div>
		{/if}
		</div>
	</section>

	{#if s?.footer_text}
		<div class="border-t border-line px-5 py-4 text-center text-xs text-muted">{s.footer_text}</div>
	{/if}
</div>
