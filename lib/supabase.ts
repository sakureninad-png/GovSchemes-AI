import { createClient } from '@supabase/supabase-js';

// ==========================================
// Supabase Client (Browser — anon key)
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// Supabase Admin Client (Server only — service role)
// ==========================================
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ==========================================
// Helper: Check if Supabase is configured
// ==========================================
export function isSupabaseConfigured(): boolean {
    return Boolean(
        supabaseUrl &&
        supabaseUrl !== 'your_supabase_url' &&
        supabaseAnonKey &&
        supabaseAnonKey !== 'your_supabase_anon_key'
    );
}
