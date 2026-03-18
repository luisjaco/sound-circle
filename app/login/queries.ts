import { SupabaseClient } from "@supabase/supabase-js";

export async function login(supabase: SupabaseClient, email: string, password: string) {
    let result = false;
    let redirect = '';

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (!error) {
        const { username, registered } = await isUserRegistered();

        if (registered === null) {
            await supabase.auth.signOut();
            result = false;
        } else {
            result = true
            redirect = registered ? `/${username}` : '/onboarding';
        }
    }

    return { result: result, redirect: redirect }
}

async function isUserRegistered() {
    const session = await fetch('/api/auth/session');
    const sessionData = await session.json();
    let username = ''
    let registered = null;

    if (!session.ok) {
        return { username: username, registered: registered }
    }

    const res = await fetch(`/api/supabase/users?id=${sessionData.user.id}`)
    const data = await res.json();

    if (!res.ok) {
        // keep null
    } else if (data.length === 0) {
        registered = false
    } else {
        username = data[0].username;
        registered = true;
    }

    return { username: username, registered: registered }
}