<script lang="ts">
	import { formatPrice } from '$lib/utils/format';
	import { smartSearchMatch } from '$lib/utils/search';

	let { data } = $props();
	let customers = $derived(data.customers || []);
	let search = $state('');

	let filtered = $derived(
		!search.trim()
			? customers
			: customers.filter((c) =>
					smartSearchMatch(search, [c.name, c.full_name, c.email, c.phone, c.mobile_number, c.id])
				)
	);
</script>

<svelte:head>
	<title>Customers — Admin Dashboard</title>
</svelte:head>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<div>
		<h1 class="serif text-2xl font-medium text-ink">Customer Management</h1>
		<p class="text-xs text-muted">View registered customer profiles, contact info, and total order count. (Security: passwords cannot be viewed or modified).</p>
	</div>

	<input
		type="text"
		bind:value={search}
		placeholder="Search by name or email…"
		aria-label="Search customers"
		class="rounded-full border border-line bg-white px-4 py-2 text-sm focus:border-gold focus:outline-none sm:w-64"
	/>
</div>

<div class="mt-6 overflow-hidden rounded-[24px] border border-line bg-white shadow-card">
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-line bg-cream-deep/60 text-xs font-medium uppercase tracking-wider text-muted">
				<tr>
					<th class="px-5 py-3.5">Customer Name</th>
					<th class="px-5 py-3.5">Phone</th>
					<th class="px-5 py-3.5">Email</th>
					<th class="px-5 py-3.5 text-center">Total Orders</th>
					<th class="px-5 py-3.5 text-right">Total Spent</th>
					<th class="px-5 py-3.5 text-right">Registered On</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-line/60">
				{#each filtered as customer (customer.id)}
					<tr class="transition-colors hover:bg-cream-deep/30">
						<td class="px-5 py-4 font-medium text-ink">
							{customer.full_name || customer.name || 'Naidile Customer'}
						</td>
						<td class="px-5 py-4 text-body">{customer.phone || '—'}</td>
						<td class="px-5 py-4 text-body">{customer.email}</td>
						<td class="px-5 py-4 text-center">
							<span class="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-olive-deep/10 px-2 text-xs font-medium text-olive-deep">
								{customer.orderCount}
							</span>
						</td>
						<td class="px-5 py-4 text-right font-medium text-terracotta">
							{formatPrice(customer.totalSpent)}
						</td>
						<td class="px-5 py-4 text-right text-xs text-muted">
							{new Date(customer.created_at).toLocaleDateString()}
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="6" class="px-5 py-8 text-center text-placeholder">
							No customers matching your criteria.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
