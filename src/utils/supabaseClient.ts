/// <reference types="../vite-env" />
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your .env file.');
}

// Create typed Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || '', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Database table names - kept for backward compatibility
export const TABLES = {
  PROJECTS: 'projects',
  PROJECT_OPTIONS: 'project_options',
  SCENARIOS: 'scenarios',
  RECORDS: 'records',
} as const;

// Storage bucket names
export const BUCKETS = {
  PROJECTS: 'projects',
} as const;

// Type exports for convenience
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];
