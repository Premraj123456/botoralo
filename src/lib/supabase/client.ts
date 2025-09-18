import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// A function to create a Supabase client for client-side components.
// It will return null if the environment variables are not set.
export const createSupabaseClient = (): SupabaseClient<Database> | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables are not set. Client-side Supabase functionality will be disabled.");
    return null;
  }
  
  try {
    // Validate URL format
    new URL(supabaseUrl);
  } catch (e) {
    console.warn("Invalid Supabase URL in environment variables. Client-side Supabase functionality will be disabled.");
    return null;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};
