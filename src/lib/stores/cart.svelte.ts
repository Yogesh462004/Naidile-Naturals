import { showToast } from '$lib/stores/toast.svelte';

export interface CartItem {
	productId: string;
	variantId: string;
	slug: string;
	name: string;
	size: string;
	price: number;
	qty: number;
	image: string | null;
	stock?: number;
}

const STORAGE_KEY = 'naidile-cart';

function loadInitial(): CartItem[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

class CartStore {
	items = $state<CartItem[]>(loadInitial());
	totalQty = $derived(this.items.reduce((sum, i) => sum + i.qty, 0));
	totalPrice = $derived(this.items.reduce((sum, i) => sum + i.price * i.qty, 0));

	#supabase: any = null;
	#userId: string | null = null;
	#cartId: string | null = null;

	#persist() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
		}
		this.#persistToServer();
	}

	async #persistToServer() {
		if (!this.#supabase || !this.#cartId) return;
		try {
			if (this.items.length === 0) {
				await this.#supabase.from('cart_items').delete().eq('cart_id', this.#cartId);
				return;
			}

			// First fetch existing server cart items
			const { data: existingDbItems } = await this.#supabase
				.from('cart_items')
				.select('*')
				.eq('cart_id', this.#cartId);

			const currentVariantIds = new Set(this.items.map((i) => i.variantId));

			for (const item of this.items) {
				// Match existing item by variant_id if available, or fallback to product_id if only 1 item exists for that product
				const existingRow = existingDbItems?.find((dbItem: any) =>
					dbItem.variant_id ? dbItem.variant_id === item.variantId : dbItem.product_id === item.productId
				);

				if (existingRow) {
					// Try updating with variant_id if supported
					const { error: updateErr } = await this.#supabase
						.from('cart_items')
						.update({ quantity: item.qty, variant_id: item.variantId, size: item.size })
						.eq('id', existingRow.id);

					if (updateErr) {
						// Fallback if variant_id column does not exist yet on server
						await this.#supabase
							.from('cart_items')
							.update({ quantity: item.qty })
							.eq('id', existingRow.id);
					}
				} else {
					const { error: insertErr } = await this.#supabase
						.from('cart_items')
						.insert({
							cart_id: this.#cartId,
							product_id: item.productId,
							quantity: item.qty,
							variant_id: item.variantId,
							size: item.size
						});

					if (insertErr) {
						// Fallback if variant_id / size columns do not exist yet on server
						await this.#supabase
							.from('cart_items')
							.insert({
								cart_id: this.#cartId,
								product_id: item.productId,
								quantity: item.qty
							});
					}
				}
			}

			// Remove server items that are no longer in our local cart
			const toRemoveIds = existingDbItems
				?.filter((dbItem: any) => {
					if (dbItem.variant_id) return !currentVariantIds.has(dbItem.variant_id);
					return !this.items.some((local) => local.productId === dbItem.product_id);
				})
				.map((dbItem: any) => dbItem.id) || [];

			if (toRemoveIds.length > 0) {
				await this.#supabase.from('cart_items').delete().in('id', toRemoveIds);
			}
		} catch (e) {
			console.error('Failed to sync cart to server', e);
		}
	}

	async syncWithServer(supabaseClient: any, userId: string) {
		this.#supabase = supabaseClient;
		this.#userId = userId;

		try {
			let { data: cartRow } = await this.#supabase
				.from('carts')
				.select('id')
				.eq('customer_id', userId)
				.maybeSingle();

			if (!cartRow) {
				const { data: newCart } = await this.#supabase
					.from('carts')
					.insert({ customer_id: userId })
					.select('id')
					.single();
				cartRow = newCart;
			}

			if (!cartRow) return;
			this.#cartId = cartRow.id;

			if (this.items.length > 0) {
				await this.#persistToServer();
			} else {
				const { data: dbItems } = await this.#supabase
					.from('cart_items')
					.select('*')
					.eq('cart_id', this.#cartId);

				if (dbItems && dbItems.length > 0) {
					// Load detailed product & variant info for each item
					const loaded: CartItem[] = [];
					for (const row of dbItems) {
						const { data: p } = await this.#supabase
							.from('products')
							.select('id, name, slug, price, stock, product_variants(*), product_images(*)')
							.eq('id', row.product_id)
							.maybeSingle();

						if (!p) continue;
						const variant = p.product_variants?.find((v: any) => v.id === row.variant_id || v.size === row.size) || p.product_variants?.[0] || { id: p.id, size: row.size || 'Standard', price: p.price, stock: p.stock };
						loaded.push({
							productId: p.id,
							variantId: variant.id || row.variant_id || p.id,
							slug: p.slug,
							name: p.name,
							size: variant.size || row.size || 'Standard',
							price: variant.price ?? p.price,
							qty: row.quantity,
							image: p.product_images?.[0]?.url ?? null,
							stock: variant.stock ?? p.stock
						});
					}
					if (loaded.length > 0) {
						this.items = loaded;
						if (typeof localStorage !== 'undefined') {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
						}
					}
				}
			}
		} catch (e) {
			console.error('Error during cart server synchronization:', e);
		}
	}

	clearServerSync() {
		this.#supabase = null;
		this.#userId = null;
		this.#cartId = null;
	}

	resetOnLogout() {
		this.items = [];
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
		}
		this.#supabase = null;
		this.#userId = null;
		this.#cartId = null;
	}

	add(item: Omit<CartItem, 'qty'>, qty: number) {
		const existing = this.items.find((i) => i.variantId === item.variantId);
		const maxStock = item.stock;

		if (existing) {
			const newQty = existing.qty + qty;
			if (maxStock !== undefined && newQty > maxStock) {
				existing.qty = maxStock;
				showToast(`⚠️ Out of stock! Only ${maxStock} item(s) available for ${item.name} (${item.size}).`);
			} else {
				existing.qty = newQty;
			}
			if (maxStock !== undefined) existing.stock = maxStock;
		} else {
			if (maxStock !== undefined && qty > maxStock) {
				this.items.push({ ...item, qty: maxStock });
				showToast(`⚠️ Out of stock! Added maximum available (${maxStock}) for ${item.name} (${item.size}).`);
			} else {
				this.items.push({ ...item, qty });
			}
		}
		this.#persist();
	}

	updateQty(variantId: string, qty: number) {
		const item = this.items.find((i) => i.variantId === variantId);
		if (!item) return;
		if (qty <= 0) {
			this.remove(variantId);
			return;
		}
		if (item.stock !== undefined && qty > item.stock) {
			item.qty = item.stock;
			showToast(`⚠️ Out of stock! Maximum available stock for ${item.name} (${item.size}) is ${item.stock}.`);
			this.#persist();
			return;
		}
		item.qty = qty;
		this.#persist();
	}

	remove(variantId: string) {
		const removed = this.items.find((i) => i.variantId === variantId);
		this.items = this.items.filter((i) => i.variantId !== variantId);
		this.#persist();
		if (removed) {
			showToast(`Removed ${removed.name} (${removed.size}) from cart`);
		}
	}

	clear() {
		this.items = [];
		this.#persist();
	}
}

export const cart = new CartStore();
