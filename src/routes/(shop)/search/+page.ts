import type { ProductWithRelations } from '$lib/supabase/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
	const { supabase } = await parent();

	const q = url.searchParams.get('q') ?? '';
	const categorySlug = url.searchParams.get('category') ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';

	let query = supabase
		.from('products')
		.select('*, product_images(*), product_variants(*), categories(slug, name)')
		.neq('status', 'hidden');

	if (q) query = query.ilike('name', `%${q}%`);
	if (categorySlug) {
		const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single();
		query = query.eq('category_id', cat?.id ?? '00000000-0000-0000-0000-000000000000');
	}
	if (sort === 'newest') query = query.order('created_at', { ascending: false });

	const { data: products } = await query;
	let results = (products ?? []) as unknown as ProductWithRelations[];

	if (sort === 'price') {
		results = [...results].sort((a, b) => {
			const minA = Math.min(...a.product_variants.map((v) => v.price), Infinity);
			const minB = Math.min(...b.product_variants.map((v) => v.price), Infinity);
			return minA - minB;
		});
	} else if (sort === 'popularity') {
		const { data: items } = await supabase.from('order_items').select('product_id');
		const counts = new Map<string, number>();
		for (const item of items ?? []) {
			if (item.product_id) counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
		}
		results = [...results].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
	}

	const { data: categories } = await supabase.from('categories').select('*').order('sort_order');

	return { products: results, q, categorySlug, sort, categories: categories ?? [] };
};
