import supabase from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const {email, password } = await req.json();
    const cookieStore = await cookies();

    // validate existence
    if (!email || !password) {
        return Response.json(
            { error: 'Missing credentials' },
            { status: 400 }
        )
    }

    // validate formatting

    /**
        The regular expression below cheks that a password:

        Has minimum 8 characters in length. Adjust it by modifying {8,}
        At least one uppercase English letter. You can remove this condition by removing (?=.*?[A-Z])
        At least one lowercase English letter.  You can remove this condition by removing (?=.*?[a-z])
        At least one digit. You can remove this condition by removing (?=.*?[0-9])
        At least one special character,  You can remove this condition by removing (?=.*?[#?!@$%^&*-])
     */

        
    const emailRegex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    const passwordRegex  = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
    if (!(emailRegex.test(email)) || !(passwordRegex.test(password))){
        return Response.json(
            { error: 'Invalid email or password' },
            { status: 400 }
        )
    }

    // create account
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if ( error || !data.session) {
        return Response.json(
            { error: 'Invalid email or password' },
            { status: 400}
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