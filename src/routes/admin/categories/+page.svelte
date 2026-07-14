<script lang="ts">
	import { invalidate } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	let newName = $state('');
	let newSlug = $state('');
	let newIcon = $state('');
	let newSubtitle = $state('');
	let errorMsg = $state('');

	function slugify(s: string) {
		return s
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}

	async function refresh() {
		await invalidate('supabase:db:admin-categories');
	}

	async function addCategory(e: Event) {
		e.preventDefault();
		errorMsg = '';
		if (!newName.trim()) return;

		const { error } = await data.supabase.from('categories').insert({
			name: newName.trim(),
			slug: newSlug.trim() || slugify(newName),
			icon: newIcon.trim() || null,
			subtitle: newSubtitle.trim() || null,
			sort_order: data.categories.length
		});

		if (error) {
			errorMsg = error.message;
			return;
		}
		newName = newSlug = newIcon = newSubtitle = '';
		await refresh();
	}

	async function updateCategory(c: (typeof data.categories)[number]) {
		errorMsg = '';
		const { error } = await data.supabase
			.from('categories')
			.update({ name: c.name, icon: c.icon, subtitle: c.subtitle })
			.eq('id', c.id);
		if (error) {
			errorMsg = error.message;
			return;
		}
		await refresh();
	}

	async function removeCategory(c: (typeof data.categories)[number]) {
		if (!confirm(`Delete category "${c.name}"?`)) return;
		const { error } = await data.supabase.from('categories').delete().eq('id', c.id);
		if (error) {
			alert('This category still has products in it. Move or delete those products first.');
			return;
		}
		await refresh();
	}
</script>

<svelte:head>
	<title>Categories — Admin</title>
</svelte:head>

<h1 class="text-2xl">Categories</h1>

<div class="mt-5 flex flex-col gap-3">
	{#each data.categories as c (c.id)}
		<div class="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
			<input bind:value={c.icon} placeholder="Icon" aria-label="Icon for {c.name}" class="w-16 rounded-lg border border-line px-2 py-1.5 text-center" />
			<input bind:value={c.name} aria-label="Name for {c.name}" class="flex-1 rounded-lg border border-line px-3 py-1.5" />
			<input bind:value={c.subtitle} placeholder="Subtitle" aria-label="Subtitle for {c.name}" class="flex-[2] rounded-lg border border-line px-3 py-1.5" />
			<span class="text-xs text-muted">/{c.slug}</span>
			<div class="flex gap-2">
				<button class="text-sm text-terracotta" onclick={() => updateCategory(c)}>Save</button>
				<button class="text-sm text-terracotta" onclick={() => removeCategory(c)}>Delete</button>
			</div>
		</div>
	{/each}
</div>

<h2 class="mt-8 text-lg">Add Category</h2>
<form class="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-end" onsubmit={addCategory}>
	<label class="flex flex-col gap-1 text-sm">
		Icon <span class="text-xs text-muted">(emoji)</span>
		<input bind:value={newIcon} class="w-20 rounded-lg border border-line px-2 py-1.5" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Name
		<input bind:value={newName} required class="rounded-lg border border-line px-3 py-1.5" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		URL Slug <span class="text-xs text-muted">(optional)</span>
		<input bind:value={newSlug} class="rounded-lg border border-line px-3 py-1.5" />
	</label>
	<label class="flex-1 flex-col gap-1 text-sm">
		Subtitle
		<input bind:value={newSubtitle} class="w-full rounded-lg border border-line px-3 py-1.5" />
	</label>
	<Button type="submit" variant="terracotta">Add</Button>
</form>
{#if errorMsg}<p class="mt-2 text-sm text-terracotta" role="alert" aria-live="polite">{errorMsg}</p>{/if}
