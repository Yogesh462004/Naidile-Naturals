// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database, Profile } from '$lib/supabase/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{
				session: Session | null;
				user: User | null;
				profile: Profile | null;
			}>;
			session: Session | null;
			profile: Profile | null;
		}
		interface PageData {
			session: Session | null;
			profile: Profile | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
