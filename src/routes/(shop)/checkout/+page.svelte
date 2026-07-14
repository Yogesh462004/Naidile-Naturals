<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice } from '$lib/utils/format';
	import Button from '$lib/components/Button.svelte';
	import type { Address } from '$lib/supabase/types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data } = $props();

	// Saved addresses from loader
	let addresses: Address[] = $derived(data.addresses || []);

	// Mode management
	let selectedAddressId = $state<string | 'new'>('new');
	let editingAddress = $state<Address | null>(null);

	// Form fields
	let name = $state(data.profile?.full_name ?? data.profile?.name ?? '');
	let phone = $state(data.profile?.phone ?? '');
	let address_line1 = $state('');
	let address_line2 = $state('');
	let landmark = $state('');
	let city = $state('');
	let addrState = $state('Karnataka');
	let pincode = $state('');
	let notes = $state('');
	let newAddressLabel = $state('Home');
	let saveNewAddress = $state(true);
	let makeDefault = $state(false);

	let submitting = $state(false);
	let errorMsg = $state('');

	function getFormattedAddress(a1: string, a2?: string | null, l?: string | null, c?: string | null, s?: string | null, p?: string | null) {
		return [a1, a2, l ? `Near ${l}` : '', c, s, p ? `PIN: ${p}` : ''].filter(Boolean).join(', ');
	}

	// Sync fields when selecting an existing saved address
	function selectAddress(addr: Address) {
		selectedAddressId = addr.id;
		name = addr.full_name || addr.name;
		phone = addr.phone;
		address_line1 = addr.address_line1 || addr.address_line || '';
		address_line2 = addr.address_line2 || '';
		landmark = addr.landmark || '';
		city = addr.city || '';
		addrState = addr.state || 'Karnataka';
		pincode = addr.pincode || '';
		editingAddress = null;
	}

	function startNewAddress() {
		selectedAddressId = 'new';
		if (addresses.length === 0 && (data.profile?.full_name || data.profile?.name)) {
			name = data.profile?.full_name || data.profile?.name || '';
			phone = data.profile?.phone || '';
		} else if (addresses.length > 0) {
			name = data.profile?.full_name ?? data.profile?.name ?? '';
			phone = data.profile?.phone ?? '';
			address_line1 = '';
			address_line2 = '';
			landmark = '';
			city = '';
			addrState = 'Karnataka';
			pincode = '';
		}
		editingAddress = null;
	}

	let initialSelectDone = $state(false);

	// Initialize with default or first saved address on mount/load only once
	$effect(() => {
		if (!initialSelectDone && addresses.length > 0) {
			initialSelectDone = true;
			if (selectedAddressId === 'new' && !phone && !address_line1) {
				const def = addresses.find((a) => a.is_default) || addresses[0];
				selectAddress(def);
			}
		}
	});

	async function deleteAddress(id: string, e: Event) {
		e.stopPropagation();
		if (!confirm('Delete this saved address?')) return;
		await data.supabase.from('addresses').delete().eq('id', id);
		await invalidateAll();
		if (selectedAddressId === id) {
			if (addresses.length > 0) {
				selectAddress(addresses[0]);
			} else {
				startNewAddress();
			}
		}
	}

	async function saveEditedAddress(e: Event) {
		e.preventDefault();
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

		if (!error) {
			if (selectedAddressId === editingAddress.id) {
				name = editingAddress.name;
				phone = editingAddress.phone;
				address_line1 = editingAddress.address_line1 || editingAddress.address_line || '';
				address_line2 = editingAddress.address_line2 || '';
				landmark = editingAddress.landmark || '';
				city = editingAddress.city || '';
				addrState = editingAddress.state || '';
				pincode = editingAddress.pincode || '';
			}
			editingAddress = null;
			await invalidateAll();
		}
	}

	function buildWhatsAppMessage(orderTotal: number, orderId: string, fullAddressString: string) {
		const lines = cart.items
			.map((i) => `${i.name} (${i.size}) x${i.qty} — ${formatPrice(i.price)} each`)
			.join('\n');

		return (
			`*Order ID:* ${orderId.slice(0, 8)}\n\n` +
			`Hello Naidile Naturals, I would like to order:\n\n${lines}\n\n` +
			`*Total:* ${formatPrice(orderTotal)}\n\n` +
			`*Delivery Details:*\n${name}\n${phone}\n${fullAddressString}` +
			(notes ? `\n\n*Notes:* ${notes}` : '') +
			`\n\nThank you!`
		);
	}

	async function submitOrder(e: Event) {
		e.preventDefault();
		if (!name.trim() || !phone.trim() || !address_line1.trim()) {
			errorMsg = 'Please fill in your name, phone number, and primary delivery address line.';
			return;
		}
		if (cart.items.length === 0) {
			errorMsg = 'Your cart is empty.';
			return;
		}

		submitting = true;
		errorMsg = '';

		const fullAddressString = getFormattedAddress(address_line1, address_line2, landmark, city, addrState, pincode);
		let finalAddressId = selectedAddressId !== 'new' ? selectedAddressId : null;

		// Save new address if requested or if first address
		if (selectedAddressId === 'new' && data.session?.user && (saveNewAddress || addresses.length === 0)) {
			const { data: newAddr } = await data.supabase
				.from('addresses')
				.insert({
					user_id: data.session.user.id,
					customer_id: data.session.user.id,
					label: newAddressLabel || 'Home',
					name: name.trim(),
					full_name: name.trim(),
					phone: phone.trim(),
					address_line: fullAddressString,
					address_line1: address_line1.trim(),
					address_line2: address_line2.trim() || null,
					landmark: landmark.trim() || null,
					city: city.trim() || null,
					state: addrState.trim() || null,
					pincode: pincode.trim() || null,
					is_default: makeDefault || addresses.length === 0
				})
				.select()
				.single();

			if (newAddr) finalAddressId = newAddr.id;
		}

		const total = cart.totalPrice;

		const { data: order, error: orderError } = await data.supabase
			.from('orders')
			.insert({
				user_id: data.session?.user.id ?? null,
				customer_id: data.session?.user.id ?? null,
				customer_name: name.trim(),
				customer_phone: phone.trim(),
				customer_address: fullAddressString,
				notes: notes.trim() || null,
				total,
				total_amount: total,
				address_id: finalAddressId
			})
			.select()
			.single();

		if (orderError || !order) {
			errorMsg = 'Something went wrong placing your order. Please try again or contact us on WhatsApp directly.';
			submitting = false;
			return;
		}

		const { error: itemsError } = await data.supabase.from('order_items').insert(
			cart.items.map((i) => ({
				order_id: order.id,
				product_id: i.productId,
				product_name: i.name,
				variant_size: i.size,
				price: i.price,
				qty: i.qty,
				quantity: i.qty
			}))
		);

		if (itemsError) {
			errorMsg = 'Order saved, but something went wrong recording the items. Please contact us on WhatsApp.';
			submitting = false;
			return;
		}

		// Automatically deduct stock for each purchased variant and update total product stock
		for (const item of cart.items) {
			if (item.variantId && item.variantId !== item.productId) {
				const { data: vRow } = await data.supabase
					.from('product_variants')
					.select('stock')
					.eq('id', item.variantId)
					.maybeSingle();
				if (vRow) {
					const newVStock = Math.max(0, (vRow.stock || 0) - item.qty);
					await data.supabase
						.from('product_variants')
						.update({ stock: newVStock })
						.eq('id', item.variantId);
				}
			}
			const { data: pRow } = await data.supabase
				.from('products')
				.select('stock, status')
				.eq('id', item.productId)
				.maybeSingle();
			if (pRow) {
				const newPStock = Math.max(0, (pRow.stock || 0) - item.qty);
				const newStatus = newPStock <= 0 ? 'out_of_stock' : pRow.status === 'out_of_stock' ? 'available' : pRow.status;
				await data.supabase
					.from('products')
					.update({ stock: newPStock, status: newStatus })
					.eq('id', item.productId);
			}
		}

		let cleanNum = (data.settings?.whatsapp_number ?? '+919019816447').replace(/[^\d]/g, '');
		if (cleanNum.length === 10) cleanNum = '91' + cleanNum;
		const message = encodeURIComponent(buildWhatsAppMessage(total, order.id, fullAddressString));
		cart.clear();
		window.open(`https://api.whatsapp.com/send/?phone=${cleanNum}&text=${message}`, '_blank');
		goto(`/checkout/success?id=${order.id}`);
	}
</script>

<svelte:head>
	<title>Checkout — Naidile Naturals</title>
</svelte:head>

<div class="px-5 pt-3">
	<a href="/cart" class="text-xs text-muted hover:text-olive-deep hover:underline transition-colors inline-flex items-center gap-1">
		&larr; Back to Cart
	</a>
</div>

<Breadcrumb items={[{ label: 'Your Cart', href: '/cart' }, { label: 'Checkout' }]} />

<div class="animate-fade-in mx-auto max-w-2xl px-5 pb-8 pt-2">
	<h1 class="serif text-2xl font-medium text-ink">Checkout</h1>

	{#if cart.items.length === 0}
		<div class="mt-8 rounded-[24px] border border-line bg-white p-8 text-center shadow-card">
			<span class="text-4xl">🌿</span>
			<p class="mt-3 text-sm text-body">Your cart is empty. Add something from our shop first.</p>
			<div class="mt-5">
				<Button variant="terracotta" onclick={() => goto('/')}>Browse Products</Button>
			</div>
		</div>
	{:else}
		<!-- Order Summary Preview -->
		<div class="mt-5 rounded-[20px] border border-line bg-white p-5 shadow-card">
			<h2 class="serif text-base font-medium text-ink">Order Summary ({cart.totalQty} items)</h2>
			<div class="mt-3 flex flex-col gap-2 text-sm text-body">
				{#each cart.items as item (item.variantId)}
					<div class="flex justify-between border-b border-line/60 pb-2 last:border-none last:pb-0">
						<span><strong class="font-medium text-ink">{item.name}</strong> ({item.size}) ×{item.qty}</span>
						<span class="font-medium">{formatPrice(item.price * item.qty)}</span>
					</div>
				{/each}
				<div class="mt-2 flex justify-between border-t border-line pt-3 font-medium text-ink">
					<span class="text-base">Total Amount</span>
					<span class="serif text-lg text-terracotta">{formatPrice(cart.totalPrice)}</span>
				</div>
			</div>
		</div>

		<!-- Saved Addresses Section -->
		<div class="mt-6">
			<h2 class="serif text-lg font-medium text-ink">Delivery Address</h2>

			{#if addresses.length > 0}
				<div class="mt-3 flex flex-col gap-3">
					{#each addresses as addr (addr.id)}
						<div
							role="button"
							tabindex="0"
							onclick={() => selectAddress(addr)}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectAddress(addr)}
							class="relative flex cursor-pointer flex-col rounded-[20px] border p-4 transition-all {selectedAddressId === addr.id
								? 'border-terracotta bg-cream-deep/60 ring-2 ring-terracotta/20 shadow-sm'
								: 'border-line bg-white hover:border-olive-deep/40'}"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<input
										type="radio"
										name="saved_address"
										checked={selectedAddressId === addr.id}
										onchange={() => selectAddress(addr)}
										class="h-4 w-4 accent-terracotta"
									/>
									<span class="font-medium text-ink">{addr.label}</span>
									{#if addr.is_default}
										<span class="rounded-full bg-olive-deep/10 px-2 py-0.5 text-[0.68rem] font-medium text-olive-deep uppercase">
											Default
										</span>
									{/if}
								</div>
								<div class="flex gap-3 text-xs">
									<button
										type="button"
										class="text-olive-deep underline hover:text-ink"
										onclick={(e) => {
											e.stopPropagation();
											editingAddress = { ...addr };
										}}
									>
										Edit
									</button>
									<button
										type="button"
										class="text-terracotta underline hover:text-ink"
										onclick={(e) => deleteAddress(addr.id, e)}
									>
										Delete
									</button>
								</div>
							</div>

							<div class="mt-2 pl-6 text-sm text-body">
								<div class="font-medium text-ink">{addr.full_name || addr.name} · {addr.phone}</div>
								<div class="mt-0.5 leading-relaxed text-muted">{addr.address_line}</div>
							</div>
						</div>
					{/each}

					<button
						type="button"
						onclick={startNewAddress}
						class="flex items-center justify-center gap-2 rounded-[20px] border border-dashed border-terracotta/60 bg-white/60 p-3.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/5"
					>
						<span>+ Add New Delivery Address</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Inline Edit Modal/Card for existing address -->
		{#if editingAddress}
			<div class="mt-4 rounded-[20px] border border-olive-deep bg-cream-deep p-5 shadow-card">
				<h3 class="serif text-base font-medium text-ink">Edit Saved Address ({editingAddress.label})</h3>
				<form onsubmit={saveEditedAddress} class="mt-3 flex flex-col gap-3 text-sm">
					<div class="grid grid-cols-2 gap-3">
						<label class="flex flex-col gap-1">
							Label
							<select
								bind:value={editingAddress.label}
								class="rounded-xl border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
							>
								<option value="Home">Home</option>
								<option value="Office">Office</option>
								<option value="Parents Home">Parents Home</option>
								<option value="Other">Other</option>
							</select>
						</label>
						<label class="flex flex-col gap-1">
							Full Name
							<input
								bind:value={editingAddress.name}
								required
								type="text"
								class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
							/>
						</label>
					</div>
					<label class="flex flex-col gap-1">
						Phone Number
						<input
							bind:value={editingAddress.phone}
							required
							type="tel"
							class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
						/>
					</label>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<label class="flex flex-col gap-1">
							House / Flat No., Building, Street
							<input
								bind:value={editingAddress.address_line1}
								required
								type="text"
								class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
							/>
						</label>
						<label class="flex flex-col gap-1">
							Area / Locality / Sector
							<input
								bind:value={editingAddress.address_line2}
								type="text"
								class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
							/>
						</label>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
						<label class="flex flex-col gap-1">
							Landmark
							<input
								bind:value={editingAddress.landmark}
								type="text"
								class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
							/>
						</label>
						<label class="flex flex-col gap-1">
							City / District
							<input
								bind:value={editingAddress.city}
								type="text"
								class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
							/>
						</label>
						<label class="flex flex-col gap-1">
							State
							<input
								bind:value={editingAddress.state}
								type="text"
								class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
							/>
						</label>
						<label class="flex flex-col gap-1">
							PIN Code
							<input
								bind:value={editingAddress.pincode}
								type="text"
								class="rounded-xl border border-line bg-white px-3 py-2 focus:border-gold focus:outline-none"
							/>
						</label>
					</div>
					<label class="flex items-center gap-2 pt-1 text-xs text-body">
						<input bind:checked={editingAddress.is_default} type="checkbox" class="h-4 w-4 accent-terracotta" />
						Mark as my default delivery address
					</label>
					<div class="mt-2 flex gap-2">
						<Button type="submit" variant="terracotta" class="text-xs py-2 px-4">Update Address</Button>
						<Button type="button" variant="secondary" class="text-xs py-2 px-4" onclick={() => (editingAddress = null)}>Cancel</Button>
					</div>
				</form>
			</div>
		{/if}

		<!-- New Address Form or Selected Address Details -->
		<form class="mt-5 flex flex-col gap-4 rounded-[20px] border border-line bg-white p-5 shadow-card" onsubmit={submitOrder}>
			{#if selectedAddressId === 'new'}
				<div class="flex items-center justify-between border-b border-line/60 pb-3">
					<h3 class="serif text-base font-medium text-ink">
						{addresses.length === 0 ? 'Enter Delivery Address' : 'New Address Details'}
					</h3>
					<div class="flex items-center gap-2 text-xs text-muted">
						<span>Label:</span>
						{#each ['Home', 'Office', 'Parents Home', 'Other'] as lbl}
							<button
								type="button"
								onclick={() => (newAddressLabel = lbl)}
								class="rounded-full px-2.5 py-1 transition-colors {newAddressLabel === lbl ? 'bg-terracotta text-white font-medium' : 'bg-cream text-ink border border-line'}"
							>
								{lbl}
							</button>
						{/each}
					</div>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label class="flex flex-col gap-1 text-sm">
						Full Name
						<input
							bind:value={name}
							required
							type="text"
							placeholder="Yogesh Patil"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						Phone Number (for Delivery &amp; WhatsApp)
						<input
							bind:value={phone}
							required
							type="tel"
							placeholder="9876543210"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label class="flex flex-col gap-1 text-sm">
						Address Line 1 (House / Flat No., Building, Street)
						<input
							bind:value={address_line1}
							required
							type="text"
							placeholder="#123, 4th Cross, Main Road"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						Address Line 2 (Area, Locality, Sector)
						<input
							bind:value={address_line2}
							type="text"
							placeholder="Vijayanagar / Jayanagar"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
					<label class="flex flex-col gap-1 text-sm">
						Landmark (Optional)
						<input
							bind:value={landmark}
							type="text"
							placeholder="Near Post Office"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						City / District
						<input
							bind:value={city}
							required
							type="text"
							placeholder="Bangalore"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						State
						<input
							bind:value={addrState}
							required
							type="text"
							placeholder="Karnataka"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						PIN Code
						<input
							bind:value={pincode}
							required
							type="text"
							placeholder="560040"
							class="rounded-xl border border-line px-3.5 py-2.5 focus:border-terracotta focus:outline-none"
						/>
					</label>
				</div>

				{#if data.session?.user}
					<div class="flex flex-col gap-2 border-t border-line/50 pt-2 text-xs text-body">
						<label class="flex items-center gap-2 cursor-pointer">
							<input bind:checked={saveNewAddress} type="checkbox" class="h-4 w-4 accent-terracotta" />
							Save this address as <strong class="font-medium text-ink">"{newAddressLabel}"</strong> for future checkout
						</label>
						{#if saveNewAddress || addresses.length === 0}
							<label class="flex items-center gap-2 cursor-pointer text-muted">
								<input bind:checked={makeDefault} type="checkbox" class="h-4 w-4 accent-terracotta" />
								Make this my default delivery address
							</label>
						{/if}
					</div>
				{/if}
			{:else}
				<div class="rounded-xl bg-cream-deep/60 p-3.5 text-sm">
					<div class="flex items-center justify-between font-medium text-ink">
						<span>Selected Address: {addresses.find(a => a.id === selectedAddressId)?.label || 'Saved Address'}</span>
						<button type="button" class="text-xs text-olive-deep underline" onclick={startNewAddress}>Change / Add New</button>
					</div>
					<div class="mt-1 text-muted">
						{name} · {phone}<br />
						{addresses.find(a => a.id === selectedAddressId)?.address_line}
					</div>
				</div>
			{/if}

			<label class="flex flex-col gap-1 text-sm border-t border-line/60 pt-3">
				Order Notes (Optional)
				<textarea
					bind:value={notes}
					rows="2"
					placeholder="Any special instructions for delivery or gift wrapping..."
					class="rounded-xl border border-line px-3.5 py-2 focus:border-terracotta focus:outline-none"
				></textarea>
			</label>

			{#if errorMsg}
				<div class="rounded-xl bg-terracotta/10 p-3 text-sm font-medium text-terracotta" role="alert" aria-live="polite">
					⚠️ {errorMsg}
				</div>
			{/if}

			<div class="mt-2 flex flex-col gap-2">
				<Button type="submit" variant="terracotta" disabled={submitting} class="w-full py-3.5 text-base">
					{submitting ? 'Placing Order…' : `Place Order via WhatsApp — ${formatPrice(cart.totalPrice)}`}
				</Button>
				<p class="text-center text-xs text-muted">
					Clicking Place Order will securely record your order and open WhatsApp with your item summary ready to send to our team.
				</p>
			</div>
		</form>
	{/if}
</div>
