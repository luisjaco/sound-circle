import { SupabaseClient } from '@supabase/supabase-js';

// shared moderation helper
// checks if a given user is a moderator or admin
// used across all moderation api routes

export async function isModerator(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const [modRes, adminRes] = await Promise.all([
        supabase.from('moderator').select('id').eq('user_id', userId).single(),
        supabase.from('admin').select('id').eq('user_id', userId).single(),
    ]);

    return !modRes.error || !adminRes.error;
}