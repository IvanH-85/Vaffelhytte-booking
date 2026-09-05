import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zbvnrnaxzahrgiashtyy.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_1wDpRQGKo7ET-UWRRfYo-Q_nTgxtNQt';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
export const supabaseConfigured = true;
