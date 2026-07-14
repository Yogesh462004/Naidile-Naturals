<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatPrice } from '$lib/utils/format';

	import { smartSearchMatch } from '$lib/utils/search';

	let { data } = $props();

	const statusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'confirmed', label: 'Confirmed / Accepted' },
		{ value: 'processing', label: 'Processing' },
		{ value: 'packed', label: 'Packing / Packed' },
		{ value: 'shipped', label: 'Shipped' },
		{ value: 'delivered', label: 'Delivered' },
		{ value: 'cancelled', label: 'Cancelled' }
	] as const;

	let filter = $state<'all' | string>('all');
	let searchQuery = $state('');
	let updatingId = $state<string | null>(null);

	function getNormalizedStatus(status: string | null | undefined): string {
		if (!status) return 'pending';
		const s = status.toLowerCase().trim();
		if (s === 'accepted') return 'confirmed';
		if (s === 'packing') return 'packed';
		if (statusOptions.some((o) => o.value === s)) return s;
		return 'pending';
	}

	const filtered = $derived(
		data.orders.filter((o) => {
			const norm = getNormalizedStatus(o.status);
			const matchesFilter = filter === 'all' || norm === filter.toLowerCase();
			if (!matchesFilter) return false;
			return smartSearchMatch(searchQuery, [
				o.id,
				o.customer_name,
				o.customer_phone,
				o.customer_address,
				o.notes,
				...(o.order_items?.map((item: any) => `${item.product_name || ''} ${item.variant_size || ''}`) || [])
			]);
		})
	);

	const statusRank: Record<string, number> = {
		pending: 1,
		confirmed: 2,
		processing: 3,
		packed: 4,
		shipped: 5,
		delivered: 6
	};

	async function handleStatusChange(order: any, e: Event) {
		const selectEl = e.currentTarget as HTMLSelectElement;
		const newStatus = selectEl.value;
		const oldStatus = getNormalizedStatus(order.status);

		if (newStatus === oldStatus) return;

		// Edge case check: if moving backwards in the normal lifecycle (e.g., Shipped -> Confirmed, Packed -> Pending)
		const oldRank = statusRank[oldStatus] || 0;
		const newRank = statusRank[newStatus] || 0;
		if (oldRank > 0 && newRank > 0 && newRank < oldRank && oldStatus !== 'delivered') {
			const confirmBackward = confirm(
				`⚠️ REGRESSION WARNING: You are moving Order #${order.id.slice(0, 8)} BACKWARDS in its lifecycle!\n\nIt was already at "${oldStatus.toUpperCase()}" (Step ${oldRank}/6).\nAre you sure you want to revert it to "${newStatus.toUpperCase()}" (Step ${newRank}/6)?`
			);
			if (!confirmBackward) {
				selectEl.value = oldStatus;
				return;
			}
		}

		// Edge case check: if already delivered
		if (oldStatus === 'delivered' && newStatus !== 'delivered') {
			const confirmDeliveredChange = confirm(
				`Order #${order.id.slice(0, 8)} is ALREADY DELIVERED.\nAre you sure you want to change its status to "${newStatus.toUpperCase()}"?`
			);
			if (!confirmDeliveredChange) {
				selectEl.value = oldStatus;
				return;
			}
		}

		// Edge case check: if cancelling order
		if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
			const confirmCancel = confirm(
				`Are you sure you want to CANCEL Order #${order.id.slice(0, 8)} for ${order.customer_name || 'Customer'}?\n\n⚠️ This will automatically deduct ${formatPrice(order.total || order.total_amount)} from your Net Revenue.`
			);
			if (!confirmCancel) {
				selectEl.value = oldStatus;
				return;
			}
		}

		// Edge case check: if un-cancelling order
		if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
			const confirmRestore = confirm(
				`Order #${order.id.slice(0, 8)} was previously CANCELLED.\n\nRestoring it to "${newStatus.toUpperCase()}" will add ${formatPrice(order.total || order.total_amount)} back to your Net Revenue. Proceed?`
			);
			if (!confirmRestore) {
				selectEl.value = oldStatus;
				return;
			}
		}

		updatingId = order.id;
		await data.supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
		await invalidateAll();
		updatingId = null;
	}
</script>

<svelte:head>
	<title>Orders Management — Admin Portal</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-4">
	<div>
		<h1 class="serif text-2xl font-medium text-ink">Orders Management</h1>
		<p class="text-xs text-muted">View, search, filter, and manage order lifecycle status (`Cancelled` orders automatically deduct from Net Revenue)</p>
	</div>
</div>

<div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	<div class="relative w-full sm:w-80">
		<input
			bind:value={searchQuery}
			type="text"
			placeholder="Search Order ID, Name, Phone..."
			aria-label="Search orders"
			class="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm focus:border-gold focus:outline-none shadow-sm"
		/>
		{#if searchQuery}
			<button onclick={() => (searchQuery = '')} aria-label="Clear search" class="absolute right-3 top-2.5 text-xs text-muted hover:text-ink">✕</button>
		{/if}
	</div>

	<div class="flex gap-1.5 overflow-x-auto pb-1">
		<button
			class="rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition {filter === 'all'
				? 'bg-olive-deep text-white shadow-sm'
				: 'border border-line bg-white text-ink hover:bg-stone-50'}"
			onclick={() => (filter = 'all')}
		>
			All ({data.orders.length})
		</button>
		{#each statusOptions as opt (opt.value)}
			<button
				class="rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition {filter === opt.value
					? opt.value === 'cancelled'
						? 'bg-terracotta text-white shadow-sm'
						: 'bg-olive-deep text-white shadow-sm'
					: 'border border-line bg-white text-ink hover:bg-stone-50'}"
				onclick={() => (filter = opt.value)}
			>
				{opt.label.split('/')[0].trim()}
			</button>
		{/each}
	</div>
</div>

<div class="mt-5 flex flex-col gap-3">
	{#each filtered as order (order.id)}
		<div
			class="rounded-2xl border bg-white p-5 shadow-card transition {getNormalizedStatus(order.status) === 'cancelled'
				? 'border-terracotta/40 bg-terracotta/5'
				: getNormalizedStatus(order.status) === 'delivered'
					? 'border-emerald-600/30 bg-emerald-50/20'
					: 'border-line'}"
		>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<div class="flex items-center gap-2">
						<span class="serif text-lg font-medium text-ink">{order.customer_name || 'Guest Customer'}</span>
						{#if getNormalizedStatus(order.status) === 'cancelled'}
							<span class="rounded-full bg-terracotta px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
								Cancelled — Revenue Deducted
							</span>
						{:else if getNormalizedStatus(order.status) === 'delivered'}
							<span class="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
								Delivered
							</span>
						{:else if getNormalizedStatus(order.status) === 'confirmed'}
							<span class="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
								Confirmed
							</span>
						{/if}
					</div>
					<div class="mt-1 text-xs text-body font-medium">📞 Phone: {order.customer_phone || 'N/A'}</div>
					<div class="mt-0.5 text-xs text-muted max-w-prose">📍 Address: {order.customer_address || 'No address provided'}</div>
					<div class="mt-1 text-[11px] text-placeholder font-mono">Order ID: {order.id} · Date: {new Date(order.created_at).toLocaleString()}</div>
				</div>

				<div class="flex flex-col items-end gap-2">
					<div class="flex items-center gap-2">
						<span class="text-xs text-muted font-medium">Status:</span>
						<select
							value={getNormalizedStatus(order.status)}
							onchange={(e) => handleStatusChange(order, e)}
							disabled={updatingId === order.id}
							class="rounded-full border border-line bg-cream px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider focus:border-gold focus:outline-none shadow-sm cursor-pointer {getNormalizedStatus(order.status) ===
							'cancelled'
								? 'text-terracotta border-terracotta/50 bg-white'
								: getNormalizedStatus(order.status) === 'delivered'
									? 'text-emerald-700 border-emerald-600/40 bg-white'
									: 'text-olive-deep bg-white'}"
						>
							{#each statusOptions as opt (opt.value)}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						{#if updatingId === order.id}
							<span class="text-xs text-terracotta animate-pulse font-semibold" role="status" aria-live="polite">Saving…</span>
						{/if}
					</div>

					{#if order.customer_phone}
						<a
							href="https://api.whatsapp.com/send/?phone={order.customer_phone.replace(/[^\d]/g, '')}&text={encodeURIComponent(
								`Hello ${order.customer_name}, regarding your order #${order.id.slice(0, 8)} (${formatPrice(order.total || order.total_amount)}) on Naidile Naturals:`
							)}"
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition shadow-xs"
						>
							<span>💬 WhatsApp Customer</span>
						</a>
					{/if}
				</div>
			</div>

			<!-- Items summary -->
			<div class="mt-4 flex flex-col gap-1.5 border-t border-line pt-3 text-sm bg-stone-50/80 rounded-xl p-3.5 border border-line/40">
				<div class="text-xs uppercase text-muted font-semibold tracking-wider mb-1">Order Items ({order.order_items?.length || 0})</div>
				{#each order.order_items as item (item.id)}
					<div class="flex justify-between items-center text-xs">
						<span class="font-medium text-ink">
							• {item.product_name} {#if item.variant_size}<span class="text-muted font-normal">({item.variant_size})</span>{/if} ×{item.qty || item.quantity || 1}
						</span>
						<span class="font-semibold text-body">{formatPrice((item.price || 0) * (item.qty || item.quantity || 1))}</span>
					</div>
				{/each}
			</div>

			{#if order.notes}
				<div class="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 text-xs text-amber-900">
					<strong>Customer Note:</strong> {order.notes}
				</div>
			{/if}

			<div class="mt-3 flex items-center justify-between border-t border-line pt-3">
				<span class="text-xs uppercase font-semibold text-muted tracking-wider">Total Amount</span>
				<span class="serif text-lg font-bold {getNormalizedStatus(order.status) === 'cancelled' ? 'text-muted line-through' : 'text-olive-deep'}">
					{formatPrice(order.total || order.total_amount)}
				</span>
			</div>
		</div>
	{:else}
		<div class="rounded-[20px] border border-line bg-white p-10 text-center text-sm text-placeholder shadow-sm">
			No orders found matching your search or filter.
		</div>
	{/each}
</div>
