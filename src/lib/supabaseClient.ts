import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Disable the storage lock to prevent hangs in multi-tab or Strict Mode environments
    // This is a common issue in local development
    storageKey: 'bmfx-auth-token',
  }
});

// Expose supabase globally for debugging in the console
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}
