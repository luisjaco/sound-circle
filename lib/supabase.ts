// this will hold functions for making requests to the supabase db. - luis

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://oijjrgrbqfyprbxuorqm.supabase.co';

// safe, public key;
const publishableKey = "sb_publishable_tiBtVuily4en98gHcl1P-g_O7MOJZYC";
const supabase = createClient(supabaseUrl, publishableKey);

export default supabase;