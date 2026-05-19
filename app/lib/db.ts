import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback for build time if keys are missing
const key = supabaseServiceRoleKey ?? supabasePublicKey;

if (!supabaseUrl || !key) {
	if (process.env.NODE_ENV === 'production') {
		console.warn('Supabase credentials missing. Client initialized with dummy data for build stability.');
	}
}

export const db = createClient<Database>(
	supabaseUrl || 'https://placeholder.supabase.co',
	key || 'placeholder-key',
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	}
);
