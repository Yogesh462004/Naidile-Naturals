import type { LayoutLoad } from './$types';
import type { ProductWithRelations } from '$lib/supabase/types';

export const load: LayoutLoad = async ({ parent, depends }) => {
	depends('supabase:db:categories');
	depends('supabase:db:products');
	const { supabase } = await parent();

	const { data: categories } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order');

	const { data: products } = await supabase
		.from('products')
		.select('*, product_images(*), product_variants(*), categories(slug, name)')
		.neq('status', 'hidden')
		.order('sort_order');

	return {
		categories: categories ?? [],
		products: (products ?? []) as unknown as ProductWithRelations[],
		allProducts: (products ?? []) as unknown as ProductWithRelations[]
	};
};
