import { error } from '@sveltejs/kit';
import type { ProductWithRelations } from '$lib/supabase/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, depends }) => {
	depends('supabase:db:products');
	const { supabase } = await parent();

	const { data: category } = await supabase
		.from('categories')
		.select('*')
		.eq('slug', params.slug)
		.single();

	if (!category) error(404, 'Category not found');

	const { data: products } = await supabase
		.from('products')
		.select('*, product_images(*), product_variants(*), categories(slug, name)')
		.eq('category_id', category.id)
		.neq('status', 'hidden')
		.order('sort_order');

	return { category, products: (products ?? []) as unknown as ProductWithRelations[] };
};
