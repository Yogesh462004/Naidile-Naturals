import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
	const { session, profile } = await safeGetSession();
	return {
		session,
		profile,
		cookies: cookies.getAll()
	};
};
