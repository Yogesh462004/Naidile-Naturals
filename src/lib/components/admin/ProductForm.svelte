<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import type { Category, ProductWithRelations } from '$lib/supabase/types';
	import type { SupabaseClient } from '@supabase/supabase-js';

	let {
		supabase,
		categories,
		product = null
	}: {
		supabase: SupabaseClient;
		categories: Category[];
		product?: ProductWithRelations | null;
	} = $props();

	function slugify(s: string) {
		return s
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}

	let name = $state(product?.name ?? '');
	let slug = $state(product?.slug ?? '');
	let slugTouched = $state(!!product);
	let categoryId = $state(product?.category_id ?? categories[0]?.id ?? '');
	let eyebrow = $state(product?.eyebrow ?? '');
	let description = $state(product?.description ?? '');
	let careNote = $state(product?.care_note ?? '');
	let ingredients = $state(product?.ingredients ?? '');
	let benefits = $state(product?.benefits ?? '');
	let usageInstructions = $state(product?.usage_instructions ?? '');
	let status = $state(product?.status ?? 'available');

	let variants = $state(
		product?.product_variants?.length
			? product.product_variants.map((v) => ({ id: v.id, size: v.size, price: v.price, stock: v.stock }))
			: [{ id: null as string | null, size: '', price: 0, stock: 0 }]
	);

	let images = $state<{ id: string | null; url: string }[]>(
		product?.product_images?.map((i) => ({ id: i.id, url: i.url })) ?? []
	);
	let uploading = $state(false);
	let submitting = $state(false);
	let errorMsg = $state('');

	function onNameInput() {
		if (!slugTouched) slug = slugify(name);
	}

	function addVariant() {
		variants.push({ id: null, size: '', price: 0, stock: 0 });
	}

	function removeVariant(i: number) {
		variants.splice(i, 1);
	}

	async function uploadImage(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		const path = `${slug || 'product'}/${Date.now()}-${file.name}`;
		const { error } = await supabase.storage.from('product-images').upload(path, file);
		uploading = false;

		if (error) {
			errorMsg = `Image upload failed: ${error.message}`;
			return;
		}

		const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path);
		images.push({ id: null, url: publicUrl.publicUrl });
		input.value = '';
	}

	function removeImage(i: number) {
		images.splice(i, 1);
	}

	async function submit(e: Event) {
		e.preventDefault();
		errorMsg = '';

		if (!name.trim() || !slug.trim() || !categoryId) {
			errorMsg = 'Name, URL slug, and category are required.';
			return;
		}
		if (variants.some((v) => !v.size.trim() || v.price < 0)) {
			errorMsg = 'Every size needs a name and a valid price.';
			return;
		}

		submitting = true;

		const minPrice = variants.length ? Math.min(...variants.map((v) => Number(v.price) || 0)) : 0;
		const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
		const firstImage = images[0]?.url || '/images/product-sunscreen.jpg';

		const payload = {
			name: name.trim(),
			slug: slug.trim(),
			category_id: categoryId,
			eyebrow: eyebrow.trim() || null,
			description: description.trim() || null,
			care_note: careNote.trim() || null,
			ingredients: ingredients.trim() || null,
			benefits: benefits.trim() || null,
			usage_instructions: usageInstructions.trim() || null,
			usage: usageInstructions.trim() || null,
			price: minPrice,
			stock: totalStock,
			image_url: firstImage,
			status,
			is_active: status !== 'hidden' && status !== 'discontinued'
		};

		let productId = product?.id;

		if (productId) {
			const { error } = await supabase.from('products').update(payload).eq('id', productId);
			if (error) {
				errorMsg = error.message;
				submitting = false;
				return;
			}
		} else {
			const { data: inserted, error } = await supabase.from('products').insert(payload).select().single();
			if (error || !inserted) {
				errorMsg = error?.message ?? 'Could not create product.';
				submitting = false;
				return;
			}
			productId = inserted.id;
		}

		// ponytail: replace-all rather than diff/upsert — simpler, and variant/image ids aren't
		// referenced anywhere durable enough to need to survive an edit.
		await supabase.from('product_variants').delete().eq('product_id', productId);
		if (variants.length) {
			await supabase.from('product_variants').insert(
				variants.map((v, i) => ({
					product_id: productId,
					size: v.size.trim(),
					price: v.price,
					stock: v.stock,
					sort_order: i
				}))
			);
		}

		await supabase.from('product_images').delete().eq('product_id', productId);
		if (images.length) {
			await supabase
				.from('product_images')
				.insert(images.map((img, i) => ({ product_id: productId, url: img.url, sort_order: i })));
		}

		submitting = false;
		goto('/admin/products');
	}
</script>

<form class="flex flex-col gap-5" onsubmit={submit}>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<label class="flex flex-col gap-1 text-sm">
			Product Name
			<input
				bind:value={name}
				oninput={onNameInput}
				required
				class="rounded-xl border border-line px-3 py-2.5"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			URL Slug
			<input
				bind:value={slug}
				oninput={() => (slugTouched = true)}
				required
				class="rounded-xl border border-line px-3 py-2.5"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Category
			<select bind:value={categoryId} class="rounded-xl border border-line px-3 py-2.5">
				{#each categories as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Availability
			<select bind:value={status} class="rounded-xl border border-line px-3 py-2.5">
				<option value="available">Available</option>
				<option value="out_of_stock">Out of Stock</option>
				<option value="coming_soon">Coming Soon</option>
				<option value="hidden">Hidden</option>
				<option value="discontinued">Discontinued</option>
			</select>
		</label>
		<label class="flex flex-col gap-1 text-sm sm:col-span-2">
			Short Tagline <span class="text-xs text-muted">(e.g. "Skin Care · SPF 20+")</span>
			<input bind:value={eyebrow} class="rounded-xl border border-line px-3 py-2.5" />
		</label>
	</div>

	<label class="flex flex-col gap-1 text-sm">
		Description
		<textarea bind:value={description} rows="3" class="rounded-xl border border-line px-3 py-2.5"></textarea>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Care Note <span class="text-xs text-muted">(optional, e.g. storage instructions)</span>
		<textarea bind:value={careNote} rows="2" class="rounded-xl border border-line px-3 py-2.5"></textarea>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Ingredients <span class="text-xs text-muted">(optional)</span>
		<textarea bind:value={ingredients} rows="2" class="rounded-xl border border-line px-3 py-2.5"></textarea>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Benefits <span class="text-xs text-muted">(optional)</span>
		<textarea bind:value={benefits} rows="2" class="rounded-xl border border-line px-3 py-2.5"></textarea>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		How to Use <span class="text-xs text-muted">(optional)</span>
		<textarea bind:value={usageInstructions} rows="2" class="rounded-xl border border-line px-3 py-2.5"
		></textarea>
	</label>

	<div>
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium">Sizes & Prices</span>
			<button type="button" class="text-sm text-terracotta" onclick={addVariant}>+ Add Size</button>
		</div>
		<div class="mt-2 flex flex-col gap-2">
			{#each variants as v, i (i)}
				<div class="flex items-center gap-2">
					<input placeholder="Size (e.g. 50ml)" aria-label="Size" bind:value={v.size} class="w-32 rounded-xl border border-line px-3 py-2" />
					<input
						type="number"
						min="0"
						placeholder="Price ₹"
						aria-label="Price"
						bind:value={v.price}
						class="w-24 rounded-xl border border-line px-3 py-2"
					/>
					<input
						type="number"
						min="0"
						placeholder="Stock"
						aria-label="Stock"
						bind:value={v.stock}
						class="w-24 rounded-xl border border-line px-3 py-2"
					/>
					{#if variants.length > 1}
						<button type="button" class="text-sm text-terracotta" onclick={() => removeVariant(i)}>Remove</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div>
		<span class="text-sm font-medium">Photos</span>
		<div class="mt-2 flex flex-wrap gap-3">
			{#each images as img, i (img.url)}
				<div class="relative">
					<div class="h-20 w-20 rounded-lg bg-cream-deep border border-line flex items-center justify-center p-1 overflow-hidden">
						<img src={img.url} alt="" class="max-h-full max-w-full rounded-[6px] object-contain" />
					</div>
					<button
						type="button"
						aria-label="Remove photo"
						class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-xs text-white"
						onclick={() => removeImage(i)}>×</button
					>
				</div>
			{/each}
			<label
				class="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted"
			>
				{uploading ? '…' : '+ Photo'}
				<input type="file" accept="image/*" class="hidden" onchange={uploadImage} disabled={uploading} />
			</label>
		</div>
	</div>

	{#if errorMsg}<p class="text-sm text-terracotta" role="alert" aria-live="polite">{errorMsg}</p>{/if}

	<div class="flex gap-3">
		<Button type="submit" variant="terracotta" disabled={submitting}>
			{submitting ? 'Saving…' : product ? 'Save Changes' : 'Add Product'}
		</Button>
		<Button variant="secondary" disabled={submitting} onclick={() => goto('/admin/products')}>Cancel</Button>
	</div>
</form>
