
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// This client is intended for server-side use ONLY, specifically in contexts
// where RLS needs to be bypassed, like handling webhooks or admin tasks.
// It uses the SERVICE_ROLE_KEY, which has superuser privileges.
export const createSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase URL or Service Role Key is missing. Admin client cannot be created.');
    return null;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
