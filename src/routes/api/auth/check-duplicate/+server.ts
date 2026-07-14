import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { email, phone } = await request.json();

		if (!email && !phone) {
			return json({ exists: false });
		}

		const cleanPhone = phone ? phone.replace(/[^\d]/g, '').slice(-10) : '';
		const cleanEmail = (email || '').trim().toLowerCase();

		// Check profiles using service role if available or fallback query
		const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
		const supabaseClient = serviceRoleKey
			? createClient(PUBLIC_SUPABASE_URL, serviceRoleKey, { auth: { persistSession: false } })
			: (locals.supabase as any);

		// Step 1: Call check_account_duplicate RPC (Security Definer bypassing RLS)
		let rpcError: any = null;
		if (cleanPhone && cleanPhone.length === 10) {
			const { data: rpcMatches, error: err } = await supabaseClient.rpc('check_account_duplicate', {
				p_email: cleanEmail,
				p_phone: cleanPhone
			});
			rpcError = err;

			if (!rpcError && Array.isArray(rpcMatches) && rpcMatches.length > 0) {
				const match = rpcMatches.find((m: any) => m.reason === 'email' || (m.reason === 'phone' && (m.matched_value || '').replace(/[^\d]/g, '').slice(-10) === cleanPhone));
				if (match) {
					if (match.reason === 'email') {
						return json({
							exists: true,
							reason: 'email',
							message: `An account is already registered with the email address (${cleanEmail}). Please use Customer Login instead.`
						});
					}
					if (match.reason === 'phone') {
						return json({
							exists: true,
							reason: 'phone',
							message: `An account is already registered with the mobile number (+91 ${cleanPhone}). Please use Customer Login instead.`
						});
					}
				}
			}
		}

		// Step 2: Exact fallback queries on profiles table
		if (cleanEmail) {
			const { data: emailMatches } = await supabaseClient
				.from('profiles')
				.select('id, email, phone, role')
				.ilike('email', cleanEmail)
				.limit(1);

			if (emailMatches && emailMatches.length > 0) {
				return json({
					exists: true,
					reason: 'email',
					message: `An account is already registered with the email address (${emailMatches[0].email}). Please use Customer Login instead.`
				});
			}
		}

		if (cleanPhone && cleanPhone.length === 10) {
			const { data: phoneMatches } = await supabaseClient
				.from('profiles')
				.select('id, email, phone, role')
				.ilike('phone', `%${cleanPhone}`)
				.limit(10);

			if (phoneMatches && Array.isArray(phoneMatches)) {
				const match = phoneMatches.find((p: any) => {
					const pClean = (p.phone || '').replace(/[^\d]/g, '');
					return pClean.length >= 10 && pClean.slice(-10) === cleanPhone;
				});

				if (match) {
					return json({
						exists: true,
						reason: 'phone',
						message: `An account is already registered with the mobile number (+91 ${cleanPhone}). Please use Customer Login instead.`
					});
				}
			}
		}

		// If RPC failed and direct queries returned 0 rows (likely due to RLS), let's check if the SQL script hasn't been run
		if (rpcError && (rpcError.message?.includes('function') || rpcError.code === 'PGRST202')) {
			return json({
				exists: true,
				reason: 'setup_required',
				message: `Database setup required: Please run the SQL query from 'supabase/migrations/20260714000002_customer_mobile_login.sql' inside your Supabase Dashboard -> SQL Editor so duplicate checking and OTP login work without RLS blocking!`
			});
		}

		return json({ exists: false });
	} catch (err: any) {
		return json({ exists: false, error: err.message });
	}
};
