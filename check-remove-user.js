import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let url = process.env.PUBLIC_SUPABASE_URL || 'https://jzkvfvllbsyvhdfxfxsq.supabase.co';

try {
	if (fs.existsSync('.env')) {
		const envContent = fs.readFileSync('.env', 'utf-8');
		for (const line of envContent.split('\n')) {
			if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
				serviceRoleKey = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
			}
			if (line.startsWith('PUBLIC_SUPABASE_URL=')) {
				url = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
			}
		}
	}
} catch (e) {}

if (!serviceRoleKey) {
	console.log('Error: SUPABASE_SERVICE_ROLE_KEY not found in .env');
	process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

async function checkAndRemove() {
	const phone = '9535647024';
	console.log(`Checking profiles and auth.users for ${phone}...`);

	// Check profiles table
	const { data: profiles, error: pErr } = await supabase
		.from('profiles')
		.select('*')
		.ilike('phone', `%${phone}%`);

	if (profiles && profiles.length > 0) {
		console.log(`Found ${profiles.length} profile(s) with phone ${phone}:`, profiles.map(p => ({ id: p.id, email: p.email, phone: p.phone, role: p.role })));
		for (const p of profiles) {
			console.log(`Deleting profile ${p.id}...`);
			await supabase.from('profiles').delete().eq('id', p.id);
			console.log(`Deleting auth.user ${p.id}...`);
			await supabase.auth.admin.deleteUser(p.id);
		}
		console.log(`✅ Successfully removed ${phone} from profiles and auth.users!`);
	} else {
		console.log(`No profile found for ${phone} in profiles table.`);
	}

	// Also double check auth.users list right away
	const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
	if (users) {
		const matchedUsers = users.filter(u => (u.phone || '').includes(phone) || (u.email || '').includes(phone));
		if (matchedUsers.length > 0) {
			console.log(`Found ${matchedUsers.length} user(s) in auth.users with phone/email ${phone}:`, matchedUsers.map(u => ({ id: u.id, email: u.email, phone: u.phone })));
			for (const u of matchedUsers) {
				console.log(`Deleting auth.user ${u.id}...`);
				await supabase.auth.admin.deleteUser(u.id);
			}
			console.log(`✅ Successfully removed ${phone} from auth.users!`);
		} else {
			console.log(`No user found for ${phone} inside auth.users.`);
		}
	}
}

checkAndRemove();
