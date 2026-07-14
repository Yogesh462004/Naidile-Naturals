import { error } from '@sveltejs/kit';
import type { ProductWithRelations } from '$lib/supabase/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, depends }) => {
	depends('supabase:db:product');
	const { supabase } = await parent();

	const { data: product } = await supabase
		.from('products')
		.select('*, product_images(*), product_variants(*), categories(slug, name)')
		.eq('slug', params.slug)
		.neq('status', 'hidden')
		.order('sort_order', { referencedTable: 'product_images' })
		.order('sort_order', { referencedTable: 'product_variants' })
		.single();

	if (!product) error(404, 'Product not found');
	const typedProduct = product as unknown as ProductWithRelations;

	const { data: related } = await supabase
		.from('products')
		.select('*, product_images(*), product_variants(*), categories(slug, name)')
		.eq('category_id', typedProduct.category_id)
		.neq('id', typedProduct.id)
		.neq('status', 'hidden')
		.limit(4);

	return { product: typedProduct, related: (related ?? []) as unknown as ProductWithRelations[] };
};
