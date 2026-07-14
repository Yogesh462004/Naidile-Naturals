import type { ProductWithRelations } from '$lib/supabase/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('supabase:db:admin-products');
	const { supabase } = await parent();

	const { data: products } = await supabase
		.from('products')
		.select('*, product_images(*), product_variants(*), categories(slug, name)')
		.order('sort_order');

	return { products: (products ?? []) as unknown as ProductWithRelations[] };
};
