import { error } from '@sveltejs/kit';
import type { ProductWithRelations } from '$lib/supabase/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { supabase } = await parent();

	const { data: product } = await supabase
		.from('products')
		.select('*, product_images(*), product_variants(*), categories(slug, name)')
		.eq('id', params.id)
		.single();

	if (!product) error(404, 'Product not found');

	return { product: product as unknown as ProductWithRelations };
};
