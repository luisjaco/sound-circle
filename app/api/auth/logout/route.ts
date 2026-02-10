import supabase from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const cookieStore = await cookies();

    // verify user logged in
    const sb_access_token = cookieStore.get('sb_access_token');
    const sb_refresh_token = cookieStore.get('sb_refresh_token');

    if (!sb_access_token || !sb_refresh_token) {
        return Response.json(
            { error: "User not logged in" },
            { status: 400 }
        )
    }

    // log user out on supabase
    const { error } = await supabase.auth.signOut()
    if ( error ) {
        return Response.json(
            { error: 'Invalid sign out' },
            { status: 401}
        )
    };
    
    // remove supabase cookies
    cookieStore.delete('sb_access_token');
    cookieStore.delete('sb_refresh_token');

    return Response.json({ success: true });
}