import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const db = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await db.from('Collection').select('*');
  console.log('Collections:', data, 'Error:', error);
}

main();
