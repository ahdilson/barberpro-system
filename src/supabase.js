import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  || import.meta.env.NEXT_PUBLIC_barbershop_SUPABASE_URL
  || import.meta.env.barbershop_SUPABASE_URL
  || import.meta.env.SUPABASE_URL
  || 'https://tuvzspxlglieatqzmrll.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_barbershop_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_barbershop_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.barbershop_SUPABASE_ANON_KEY
  || import.meta.env.barbershop_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.SUPABASE_ANON_KEY
  || 'sb_publishable_C-DyAu0xiNawJt2eJxmCsw_3BRBzNM1';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = Boolean(supabase);
