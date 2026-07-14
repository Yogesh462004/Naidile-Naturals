<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	let businessPhone = $state(data.settings?.business_phone ?? '');
	let whatsappNumber = $state(data.settings?.whatsapp_number ?? '');
	let businessAddress = $state(data.settings?.business_address ?? '');
	let businessEmail = $state(data.settings?.business_email ?? '');
	let instagramUrl = $state(data.settings?.instagram_url ?? '');
	let whatsappChannelUrl = $state(data.settings?.whatsapp_channel_url ?? '');
	let footerText = $state(data.settings?.footer_text ?? '');

	let saving = $state(false);
	let saved = $state(false);
	let errorMsg = $state('');

	async function save(e: Event) {
		e.preventDefault();
		saving = true;
		saved = false;
		errorMsg = '';

		const { error } = await data.supabase
			.from('settings')
			.update({
				business_phone: businessPhone.trim() || null,
				whatsapp_number: whatsappNumber.trim() || null,
				business_address: businessAddress.trim() || null,
				business_email: businessEmail.trim() || null,
				instagram_url: instagramUrl.trim() || null,
				whatsapp_channel_url: whatsappChannelUrl.trim() || null,
				footer_text: footerText.trim() || null
			})
			.eq('id', true);

		saving = false;
		if (error) {
			errorMsg = error.message;
			return;
		}
		saved = true;
		setTimeout(() => (saved = false), 2500);
	}
</script>

<svelte:head>
	<title>Settings — Admin</title>
</svelte:head>

<h1 class="text-2xl">Settings</h1>

<form class="mt-5 flex max-w-lg flex-col gap-4" onsubmit={save}>
	<label class="flex flex-col gap-1 text-sm">
		Business Phone
		<input bind:value={businessPhone} class="rounded-xl border border-line px-3 py-2.5" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		WhatsApp Number <span class="text-xs text-muted">(used for customer orders, include country code)</span>
		<input bind:value={whatsappNumber} class="rounded-xl border border-line px-3 py-2.5" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Business Address
		<textarea bind:value={businessAddress} rows="2" class="rounded-xl border border-line px-3 py-2.5"></textarea>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Business Email
		<input bind:value={businessEmail} type="email" class="rounded-xl border border-line px-3 py-2.5" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Instagram Link
		<input bind:value={instagramUrl} class="rounded-xl border border-line px-3 py-2.5" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		WhatsApp Channel Link
		<input bind:value={whatsappChannelUrl} class="rounded-xl border border-line px-3 py-2.5" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Footer Text
		<input bind:value={footerText} class="rounded-xl border border-line px-3 py-2.5" />
	</label>

	<div class="flex items-center gap-3">
		<Button type="submit" variant="terracotta" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
		{#if saved}<span class="text-sm text-olive-deep" role="status" aria-live="polite">Saved!</span>{/if}
	</div>

	{#if errorMsg}
		<p class="text-sm text-terracotta" role="alert" aria-live="polite">{errorMsg}</p>
	{/if}
</form>
