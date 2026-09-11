import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (
    supabaseUrl === undefined ||
    supabaseUrl === '' ||
    supabaseKey === undefined ||
    supabaseKey === ''
  ) {
    return null;
  }

  client ??= createClient(supabaseUrl, supabaseKey);
  return client;
}

export function isSupabaseConfigured() {
  return getSupabaseClient() !== null;
}
