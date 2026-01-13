import { createClient } from '@supabase/supabase-js';

// Fallback values to allow Next.js build even if envs are not set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-service-role-key';

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
