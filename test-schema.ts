import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const envUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
const envKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || '';
const supabase = createClient(envUrl, envKey);

async function run() {
    const { data, error } = await supabase.rpc('get_table_columns_notx', { table_name: 'albums' });
    console.log("RPC error:", error); // probably won't work
    // instead let's try reading from information_schema if no RLS blocks it (with service key it shouldn't be blocked)
    const { data: cols, error: err2 } = await (supabase as any)
      .from('information_schema.columns')
      .select('column_name, is_nullable, data_type')
      .eq('table_name', 'albums');
    console.log("Album columns:", cols, err2);
}

run();
