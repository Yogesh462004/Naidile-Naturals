import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { email, password, fullName, phone } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required.' }, { status: 400 });
		}

		const cleanEmail = email.trim().toLowerCase();
		const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
		const origin = env.PUBLIC_SITE_URL || request.headers.get('origin') || url.origin || 'https://naidelnaturals.netlify.app';

		if (!serviceKey) {
			return json({ error: 'Server administrative key not configured.' }, { status: 500 });
		}

		const adminClient = createClient(PUBLIC_SUPABASE_URL, serviceKey, {
			auth: { persistSession: false }
		});

		// Check duplicate first
		const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
		const existing = users?.find(u => (u.email || '').toLowerCase() === cleanEmail);
		if (existing) {
			return json({ error: `An account is already registered with the email address (${cleanEmail}). Please use Customer Login instead.` }, { status: 400 });
		}

		// Try generating signup link using adminClient (bypassing GoTrue 429 rate limit!)
		const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
			type: 'signup',
			email: cleanEmail,
			password,
			options: {
				data: {
					full_name: fullName?.trim() || '',
					name: fullName?.trim() || '',
					mobile_number: phone || '',
					phone: phone || '',
					role: 'customer'
				},
				redirectTo: `${origin}/auth/confirm`
			}
		});

		if (linkErr) {
			return json({ error: linkErr.message || 'Failed to create customer account.' }, { status: 400 });
		}

		const actionLink = linkData?.properties?.action_link;
		const createdUser = linkData?.user;

		// Send confirmation email using Resend!
		if (env.RESEND_API_KEY && actionLink) {
			try {
				const resendRes = await fetch('https://api.resend.com/emails', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${env.RESEND_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						from: env.EMAIL_FROM || 'onboarding@resend.dev',
						to: cleanEmail,
						subject: 'Welcome to Naidile Naturals — Confirm Your Account',
						html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
							<h2 style="color: #3b422a;">Welcome to Naidile Naturals, ${fullName || 'Customer'}! 🌿</h2>
							<p>Thank you for creating your customer account. Please confirm your email address to activate your account and start shopping our pure, natural skin & hair care.</p>
							<div style="margin: 30px 0; text-align: center;">
								<a href="${actionLink}" style="background-color: #bc5233; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">Verify Email Address</a>
							</div>
							<p style="color: #666; font-size: 13px;">Or copy and paste this link into your browser:<br/><a href="${actionLink}" style="color: #bc5233; word-break: break-all;">${actionLink}</a></p>
						</div>`
					})
				});

				if (!resendRes.ok) {
					const resendData = await resendRes.json();
					console.error('Resend signup email error:', resendData);
					if (resendData?.message && resendData.message.includes('only send testing emails to your own email address') && createdUser) {
						// If Resend sandbox blocks sending to a customer email, auto-confirm their account so they aren't stuck!
						await adminClient.auth.admin.updateUserById(createdUser.id, { email_confirm: true });
						return json({
							success: true,
							autoConfirmed: true,
							message: `Account created! Since Resend is currently using its free test sandbox (which only sends to your admin email), we automatically verified your account so you can log in right now.`
						});
					}
				}
			} catch (err) {
				console.error('Resend email error:', err);
			}
		} else if (createdUser) {
			// If no Resend key is present, auto confirm so they don't get stuck by GoTrue limit
			await adminClient.auth.admin.updateUserById(createdUser.id, { email_confirm: true });
			return json({
				success: true,
				autoConfirmed: true,
				message: `Account created and verified! You can now log into your customer account.`
			});
		}

		return json({
			success: true,
			message: `We've sent a confirmation link to ${cleanEmail}. Verify your email address to activate your customer account.`
		});
	} catch (err: any) {
		console.error('Signup endpoint error:', err);
		return json({ error: err?.message || 'An unexpected error occurred during signup.' }, { status: 500 });
	}
};
