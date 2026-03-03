// Server-only Supabase client using service_role key.
// Bypasses RLS — only import this in API routes, NEVER in client components.
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default supabaseAdmin;