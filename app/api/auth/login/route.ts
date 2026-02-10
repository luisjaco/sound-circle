import supabase from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const {email, password } = await req.json();
    const cookieStore = await cookies();

    // validate
    if (!email || !password) {
        return Response.json(
            { error: 'Missing credentials' },
            { status: 400 }
        )
    }

    // authenticate with supabase
    const { data, error } = await supabase.auth.signInWithPassword( {
        email, 
        password
    });

    if ( error || !data.session) {
        return Response.json(
            { error: 'Invalid email or password' },
            { status: 401}
        )
    };

    // store supabase tokens in cookies
    cookieStore.set("sb_access_token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    })

    cookieStore.set("sb_refresh_token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    })

    return Response.json({ success: true });
}