/**
 * Supabase Client Configuration
 * Centralized Supabase client instance
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('=== Supabase Configuration ===');
console.log('URL configured:', !!supabaseUrl);
console.log('Anon Key configured:', !!supabaseAnonKey);
if (supabaseUrl) {
  console.log('Supabase URL:', supabaseUrl);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file');
  console.error('Current env vars:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'set' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'set' : 'MISSING'
  });
} else {
  console.log('✅ Supabase client configured successfully');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
