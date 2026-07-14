import type { SupabaseClient } from '@supabase/supabase-js';

export async function signInWithRole(
	supabase: SupabaseClient,
	email: string,
	password: string,
	requiredRole: 'admin' | 'customer'
): Promise<{ error?: string; wrongRole?: boolean }> {
	const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error || !authData.user) {
		return { error: error?.message || 'Invalid login credentials.' };
	}

	const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();
	if ((profile?.role || 'customer') !== requiredRole) {
		await supabase.auth.signOut();
		return { wrongRole: true };
	}

	return {};
}

// ponytail: @supabase/ssr's browser cookie writer hardcodes a 400-day maxAge on every
// setItem, ignoring cookieOptions.maxAge — so "remember me" can't be wired through client
// options. Instead, when unchecked, we downgrade the just-written sb-* cookies to
// session-only (no Max-Age) right after sign-in, so they're cleared when the browser closes.
export function forgetSessionCookies() {
	document.cookie.split(';').forEach((c) => {
		const name = c.split('=')[0].trim();
		if (!name.startsWith('sb-')) return;
		const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
		document.cookie = `${name}=${match?.[1] ?? ''}; path=/; SameSite=Lax`;
	});
}
