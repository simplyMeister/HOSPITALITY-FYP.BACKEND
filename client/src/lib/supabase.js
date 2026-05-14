import { createClient } from '@supabase/supabase-js';

// Generate or retrieve a unique tab ID to isolate Auth sessions per tab
// This prevents Supabase's built-in BroadcastChannel from syncing login states across tabs
let tabId = window.sessionStorage.getItem('supabase_tab_id');
if (!tabId) {
  tabId = Math.random().toString(36).substring(2, 15);
  window.sessionStorage.setItem('supabase_tab_id', tabId);
}

// Initialize Supabase Client
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: `sb-${tabId}-auth-token`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
