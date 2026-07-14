import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const { email } = await request.json();

		if (!email || typeof email !== 'string') {
			return json({ error: 'Please enter a valid email address.' }, { status: 400 });
		}

		const cleanEmail = email.trim().toLowerCase();
		const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
		const origin = env.PUBLIC_SITE_URL || request.headers.get('origin') || url.origin || 'https://naidile-naturals.netlify.app';

		// If Service Role Key is available, use admin.generateLink to bypass GoTrue 429 rate limits
		if (serviceKey) {
			const adminClient = createClient(PUBLIC_SUPABASE_URL, serviceKey, {
				auth: { persistSession: false }
			});

			// Verify user exists first
			const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
			let targetUser = null;
			if (listErr) {
				console.error('Error listing users:', listErr);
			} else if (users) {
				targetUser = users.find(u => (u.email || '').toLowerCase() === cleanEmail);
				if (!targetUser) {
					return json({
						error: `No account found registered with "${cleanEmail}". Please check for typos or create a new account.`
					}, { status: 404 });
				}
			}

			// Generate 6-digit OTP code and expiry (15 mins from now)
			const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
			const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

			if (targetUser) {
				await adminClient.auth.admin.updateUserById(targetUser.id, {
					user_metadata: {
						...(targetUser.user_metadata || {}),
						recovery_otp: otpCode,
						recovery_otp_expires_at: expiresAt
					}
				});
			}

			// Trigger Supabase's built-in email service so the user receives an actual recovery email right in their inbox!
			const { error: resetEmailErr } = await adminClient.auth.resetPasswordForEmail(cleanEmail, {
				redirectTo: `${origin}/reset-password`
			});

			// If Supabase free tier hit its hourly rate limit (max 3 emails per hour) and Resend is not configured:
			if (resetEmailErr && !env.RESEND_API_KEY) {
				console.error('Supabase email send error:', resetEmailErr);
				if (resetEmailErr.status === 429 || resetEmailErr.code === 'over_email_send_rate_limit') {
					return json({
						error: 'Supabase free email limit reached (max 3 emails per hour). Please wait an hour before requesting another email, or add a RESEND_API_KEY to .env for unlimited emails.'
					}, { status: 429 });
				}
				return json({
					error: resetEmailErr.message || 'Failed to send recovery email.'
				}, { status: 500 });
			}

			// Generate exact recovery action_link bypassing rate limit
			const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
				type: 'recovery',
				email: cleanEmail,
				options: {
					redirectTo: `${origin}/reset-password`
				}
			});

			if (linkErr) {
				console.error('Error generating recovery link:', linkErr);
			}

			const actionLink = linkData?.properties?.action_link;

			// If Resend API key is configured, try sending the email via Resend
			if (env.RESEND_API_KEY && (actionLink || otpCode)) {
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
							subject: 'Your Password Reset Verification Code — Naidile Naturals',
							html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
								<h2 style="color: #3b422a;">Password Reset Code</h2>
								<p>We received a request to reset the password for your Naidile Naturals account.</p>
								<p>Here is your 6-digit verification code to reset your password:</p>
								<div style="margin: 25px 0; padding: 18px 24px; background-color: #f7f4ee; border: 1px dashed #bc5233; border-radius: 12px; text-align: center;">
									<span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #bc5233;">${otpCode}</span>
								</div>
								<p style="color: #666; font-size: 13px;">Enter this code along with your new password on the verification screen. This code expires in 15 minutes.</p>
								${actionLink ? `<p style="color: #666; font-size: 13px; margin-top: 20px;">Or click <a href="${actionLink}" style="color: #bc5233;">here</a> to reset directly.</p>` : ''}
							</div>`
						})
					});

					if (!resendRes.ok) {
						const resendData = await resendRes.json();
						console.error('Resend API error:', resendData);
						if (resendData?.message && resendData.message.includes('only send testing emails to your own email address')) {
							if (resetEmailErr) {
								return json({
									error: `Resend Sandbox Limit: Because you are currently using Resend's free test domain (onboarding@resend.dev), Resend ONLY allows sending emails to your own registered account email address (yp901981@gmail.com).\n\nTo send emails to any customer email (like "${cleanEmail}"), add and verify your business domain inside your Resend dashboard.`
								}, { status: 403 });
							} else {
								console.warn(`Resend sandbox prevented sending to ${cleanEmail}, but Supabase built-in email service successfully delivered the recovery link.`);
							}
						}
					}
				} catch (emailErr) {
					console.error('Resend email delivery error:', emailErr);
				}
			}

			return json({
				success: true,
				message: `Verification code and recovery instructions sent to ${cleanEmail}.`
			});
		}

		return json({ error: 'Server administrative key not configured.' }, { status: 500 });
	} catch (err: any) {
		console.error('Forgot password endpoint error:', err);
		return json({ error: err?.message || 'An unexpected error occurred.' }, { status: 500 });
	}
};
