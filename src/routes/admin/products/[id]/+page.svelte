<script lang="ts">
	import { goto } from '$app/navigation';
	import ProductForm from '$lib/components/admin/ProductForm.svelte';

	let { data } = $props();

	async function remove() {
		if (!confirm(`Delete "${data.product.name}"? This cannot be undone.`)) return;
		await data.supabase.from('products').delete().eq('id', data.product.id);
		goto('/admin/products');
	}
</script>

<svelte:head>
	<title>Edit {data.product.name} — Admin</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-2xl">Edit Product</h1>
	<button class="text-sm text-terracotta" onclick={remove}>Delete Product</button>
</div>

<div class="mt-5">
	<ProductForm supabase={data.supabase} categories={data.categories} product={data.product} />
</div>
