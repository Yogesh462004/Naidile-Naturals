<script lang="ts">
	import ProductForm from '$lib/components/admin/ProductForm.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Add Product — Admin</title>
</svelte:head>

<h1 class="text-2xl">Add Product</h1>

<div class="mt-5">
	<ProductForm supabase={data.supabase} categories={data.categories} />
</div>
