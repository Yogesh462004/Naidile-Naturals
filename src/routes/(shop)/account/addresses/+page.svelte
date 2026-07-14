<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import type { Address } from '$lib/supabase/types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();

	let addresses = $derived(data.addresses || []);

	let showAddForm = $state(false);
	let editingAddress = $state<Address | null>(null);
	let errorMsg = $state('');

	// New address fields
	let label = $state('Home');
	let name = $state(data.profile?.full_name ?? data.profile?.name ?? '');
	let phone = $state(data.profile?.phone ?? '');
	let address_line1 = $state('');
	let address_line2 = $state('');
	let landmark = $state('');
	let city = $state('');
	let addrState = $state('Karnataka');
	let pincode = $state('');
	let is_default = $state(false);

	function getFormattedAddress(a1: string, a2?: string | null, l?: string | null, c?: string | null, s?: string | null, p?: string | null) {
		return [a1, a2, l ? `Near ${l}` : '', c, s, p ? `PIN: ${p}` : ''].filter(Boolean).join(', ');
	}

	async function addAddress(e: Event) {
		e.preventDefault();
		errorMsg = '';
		if (!name.trim() || !phone.trim() || !address_line1.trim()) return;

		const fullFormatted = getFormattedAddress(address_line1, address_line2, landmark, city, addrState, pincode);

		const { error } = await data.supabase.from('addresses').insert({
			user_id: data.session?.user.id,
			customer_id: data.session?.user.id,
			label,
			name: name.trim(),
			full_name: name.trim(),
			phone: phone.trim(),
			address_line: fullFormatted,
			address_line1: address_line1.trim(),
			address_line2: address_line2.trim() || null,
			landmark: landmark.trim() || null,
			city: city.trim() || null,
			state: addrState.trim() || null,
			pincode: pincode.trim() || null,
			is_default: is_default || addresses.length === 0
		});

		if (error) {
			errorMsg = error.message;
			return;
		}

		showAddForm = false;
		label = 'Home';
		phone = '';
		address_line1 = '';
		address_line2 = '';
		landmark = '';
		city = '';
		addrState = 'Karnataka';
		pincode = '';
		is_default = false;
		await invalidateAll();
	}

	async function saveEdit(e: Event) {
		e.preventDefault();
		errorMsg = '';
		if (!editingAddress) return;

		const fullFormatted = getFormattedAddress(
			editingAddress.address_line1 || editingAddress.address_line,
			editingAddress.address_line2,
			editingAddress.landmark,
			editingAddress.city,
			editingAddress.state,
			editingAddress.pincode
		);

		const { error } = await data.supabase
			.from('addresses')
			.update({
				label: editingAddress.label,
				name: editingAddress.name.trim(),
				full_name: editingAddress.name.trim(),
				phone: editingAddress.phone.trim(),
				address_line: fullFormatted,
				address_line1: (editingAddress.address_line1 || editingAddress.address_line || '').trim(),
				address_line2: (editingAddress.address_line2 || '').trim() || null,
				landmark: (editingAddress.landmark || '').trim() || null,
				city: (editingAddress.city || '').trim() || null,
				state: (editingAddress.state || '').trim() || null,
				pincode: (editingAddress.pincode || '').trim() || null,
				is_default: editingAddress.is_default
			})
			.eq('id', editingAddress.id);

		if (error) {
			errorMsg = error.message;
			return;
		}

		editingAddress = null;
		await invalidateAll();
	}

	async function deleteAddress(id: string) {
		if (!confirm('Are you sure you want to delete this address?')) return;
		errorMsg = '';
		const { error } = await data.supabase.from('addresses').delete().eq('id', id);
		if (error) {
			errorMsg = error.message;
			return;
		}
		await invalidateAll();
	}

	async function makeDefault(addr: Address) {
		errorMsg = '';
		const { error } = await data.supabase.from('addresses').update({ is_default: true }).eq('id', addr.id);
		if (error) {
			errorMsg = error.message;
			return;
		}
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Saved Addresses — My Account</title>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/account" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to My Account
	</a>
</div>

<Breadcrumb items={[{ label: 'My Account', href: '/account' }, { label: 'Saved Addresses' }]} />

<div class="animate-fade-in mx-auto max-w-2xl px-5 pb-8 pt-2">
	<div class="flex items-center justify-between border-b border-line pb-4">
		<div>
			<h1 class="serif mt-1 text-2xl font-medium text-ink">Saved Addresses</h1>
		</div>
		{#if !showAddForm && !editingAddress}
			<Button variant="terracotta" class="text-xs py-2 px-3.5" onclick={() => (showAddForm = true)}>+ Add New</Button>
		{/if}
	</div>

	{#if errorMsg}
		<div class="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta" role="alert" aria-live="polite">
			{errorMsg}
		</div>
	{/if}

	{#if showAddForm}
		<form onsubmit={addAddress} class="mt-5 rounded-[20px] border border-line bg-white p-5 shadow-card text-sm flex flex-col gap-3">
			<h3 class="serif text-base font-medium text-ink">Add New Delivery Address</h3>
			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1">
					Label
					<select bind:value={label} class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none">
						<option value="Home">Home</option>
						<option value="Office">Office</option>
						<option value="Parents Home">Parents Home</option>
						<option value="Other">Other</option>
					</select>
				</label>
				<label class="flex flex-col gap-1">
					Full Name
					<input bind:value={name} required type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
			</div>
			<label class="flex flex-col gap-1">
				Phone Number
				<input bind:value={phone} required type="tel" placeholder="9876543210" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
			</label>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1">
					House / Flat No., Building, Street
					<input bind:value={address_line1} required type="text" placeholder="#123, 4th Cross" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					Area / Locality / Sector
					<input bind:value={address_line2} type="text" placeholder="Vijayanagar" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
				<label class="flex flex-col gap-1">
					Landmark
					<input bind:value={landmark} type="text" placeholder="Near Temple" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					City
					<input bind:value={city} required type="text" placeholder="Bangalore" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					State
					<input bind:value={addrState} required type="text" placeholder="Karnataka" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					PIN Code
					<input bind:value={pincode} required type="text" placeholder="560040" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
			</div>
			<label class="flex items-center gap-2 pt-1 text-xs text-body">
				<input bind:checked={is_default} type="checkbox" class="h-4 w-4 accent-terracotta" />
				Set as default delivery address
			</label>
			<div class="mt-2 flex gap-2">
				<Button type="submit" variant="terracotta" class="text-xs py-2 px-4">Save Address</Button>
				<Button type="button" variant="secondary" class="text-xs py-2 px-4" onclick={() => (showAddForm = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	{#if editingAddress}
		<form onsubmit={saveEdit} class="mt-5 rounded-[20px] border border-olive-deep bg-cream-deep p-5 shadow-card text-sm flex flex-col gap-3">
			<h3 class="serif text-base font-medium text-ink">Edit Address</h3>
			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1">
					Label
					<select bind:value={editingAddress.label} class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none">
						<option value="Home">Home</option>
						<option value="Office">Office</option>
						<option value="Parents Home">Parents Home</option>
						<option value="Other">Other</option>
					</select>
				</label>
				<label class="flex flex-col gap-1">
					Full Name
					<input bind:value={editingAddress.name} required type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
			</div>
			<label class="flex flex-col gap-1">
				Phone Number
				<input bind:value={editingAddress.phone} required type="tel" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
			</label>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1">
					House / Flat No., Building, Street
					<input bind:value={editingAddress.address_line1} required type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					Area / Locality / Sector
					<input bind:value={editingAddress.address_line2} type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
				<label class="flex flex-col gap-1">
					Landmark
					<input bind:value={editingAddress.landmark} type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					City
					<input bind:value={editingAddress.city} type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					State
					<input bind:value={editingAddress.state} type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
				<label class="flex flex-col gap-1">
					PIN Code
					<input bind:value={editingAddress.pincode} type="text" class="rounded-xl border border-line px-3 py-2 bg-white focus:border-gold focus:outline-none" />
				</label>
			</div>
			<label class="flex items-center gap-2 pt-1 text-xs text-body">
				<input bind:checked={editingAddress.is_default} type="checkbox" class="h-4 w-4 accent-terracotta" />
				Set as default delivery address
			</label>
			<div class="mt-2 flex gap-2">
				<Button type="submit" variant="terracotta" class="text-xs py-2 px-4">Update Address</Button>
				<Button type="button" variant="secondary" class="text-xs py-2 px-4" onclick={() => (editingAddress = null)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<div class="mt-6 flex flex-col gap-3">
		{#each addresses as addr (addr.id)}
			<div class="rounded-[20px] border border-line bg-white p-4 shadow-card flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="font-medium text-ink">{addr.label}</span>
						{#if addr.is_default}
							<span class="rounded-full bg-olive-deep/10 px-2 py-0.5 text-[0.68rem] font-medium text-olive-deep uppercase">Default</span>
						{/if}
					</div>
					<div class="flex gap-3 text-xs">
						{#if !addr.is_default}
							<button type="button" class="text-muted hover:text-ink underline" onclick={() => makeDefault(addr)}>Set as Default</button>
						{/if}
						<button type="button" class="text-olive-deep underline hover:text-ink" onclick={() => (editingAddress = { ...addr })}>Edit</button>
						<button type="button" class="text-terracotta underline hover:text-ink" onclick={() => deleteAddress(addr.id)}>Delete</button>
					</div>
				</div>
				<div class="text-sm text-body">
					<strong class="text-ink">{addr.full_name || addr.name}</strong> · {addr.phone}<br />
					{addr.address_line}
				</div>
			</div>
		{:else}
			{#if !showAddForm}
				<div class="rounded-[24px] border border-line bg-white p-8 text-center text-sm text-placeholder">
					You don't have any saved delivery addresses yet.<br />Click "+ Add New" above to save one!
				</div>
			{/if}
		{/each}
	</div>
</div>
