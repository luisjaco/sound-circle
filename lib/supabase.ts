// this will hold functions for making requests to the supabase db. - luis

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oijjrgrbqfyprbxuorqm.supabase.co';

// safe, public key;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "sb_publishable_tiBtVuily4en98gHcl1P-g_O7MOJZYC";
const supabase = createClient(supabaseUrl, publishableKey);

export default supabase;