import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { password, accessToken, refreshToken, email, otpCode } = await request.json();

		const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-=+~`';/\\\[\]]).{8,}$/;
		if (!password || typeof password !== 'string' || !passwordPattern.test(password)) {
			return json({ error: 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.' }, { status: 400 });
		}

		const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
		if (!serviceKey) {
			return json({ error: 'Server administrative key not configured.' }, { status: 500 });
		}

		const adminClient = createClient(PUBLIC_SUPABASE_URL, serviceKey, {
			auth: { persistSession: false }
		});

		// If otpCode and email are provided, verify the 6-digit verification code
		if (otpCode && email) {
			const cleanEmail = email.trim().toLowerCase();
			const cleanOtp = otpCode.trim();

			const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
			const targetUser = users?.find(u => (u.email || '').toLowerCase() === cleanEmail);

			if (!targetUser) {
				return json({ error: 'No account found with that email address.' }, { status: 404 });
			}

			const storedOtp = targetUser.user_metadata?.recovery_otp;
			const expiresAt = targetUser.user_metadata?.recovery_otp_expires_at;

			if (!storedOtp || storedOtp !== cleanOtp) {
				return json({ error: 'Invalid verification code. Please check your 6-digit code and try again.' }, { status: 400 });
			}

			if (expiresAt && new Date(expiresAt) < new Date()) {
				return json({ error: 'This verification code has expired. Please request a new code.' }, { status: 400 });
			}

			// Update password and clear the OTP from metadata
			const { error: updateErr } = await adminClient.auth.admin.updateUserById(targetUser.id, {
				password,
				user_metadata: {
					...targetUser.user_metadata,
					recovery_otp: null,
					recovery_otp_expires_at: null
				}
			});

			if (updateErr) {
				return json({ error: updateErr.message || 'Failed to update password.' }, { status: 500 });
			}

			return json({ success: true, message: 'Password reset successfully!' });
		}

		// If accessToken is provided, verify who owns it and update password via admin client
		if (accessToken) {
			const { data: userData, error: userErr } = await adminClient.auth.getUser(accessToken);
			if (userErr || !userData?.user) {
				return json({ error: 'Recovery session is invalid or has expired. Please request a new password reset link.' }, { status: 401 });
			}

			const userId = userData.user.id;
			const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, { password });

			if (updateErr) {
				return json({ error: updateErr.message || 'Failed to update password.' }, { status: 500 });
			}

			return json({ success: true });
		}

		return json({ error: 'No verification code or recovery token provided.' }, { status: 400 });
	} catch (err: any) {
		console.error('Reset password endpoint error:', err);
		return json({ error: err?.message || 'An unexpected error occurred.' }, { status: 500 });
	}
};
