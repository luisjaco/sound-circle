// this route will verify login state

import supabase from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();

    const token = cookieStore.get('sb_access_token')?.value;

    // check if in storage
    if (!token) {
        return Response.json(
            { user: null },
            { status: 401 }
        )
    }

    // verify with supabase
    const {data, error} = await supabase.auth.getUser(token);

    // check if supabase error
    if (error || !data.user) {
        return Response.json(
            { user: null },
            { status: 401 }
        )
    }

    // return user data
    return Response.json({
        user: data.user
    });
}