import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    // authorization code sent by spotify after user authorizes the app
    const code = request.nextUrl.searchParams.get('code');

    if(!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // retrieve spotify client credentials from environment variables
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    // sanity check
    if(!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json({ error: "Missing Spotify client credentials"});
    }

    // structure post request to spotify token endpoint
    const authOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: redirectUri!,
            grant_type: 'authorization_code'
        })
    };

    try {
        // resolve the logged-in user from the current supabase session
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // exchange auth code for spotify access + refresh tokens
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', authOptions);
        
        if(!tokenResponse.ok) {
            return NextResponse.json({ error: 'Spotify token request failed' }, { status: 500 });
        }
        
        const tokenData = await tokenResponse.json();

        // attach cookies directly to the redirect response object.
        // if these cookies were set via cookieStore().set() prior to the redirect,
        // they would be dropped. attaching them to the response guarantees that the
        // browser receives Set-Cookie headers along with the redirect, in the same response
        
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'http';

        // redirect to the popup page (instead of onboarding)
        // this page signals the onboarding page and closes itself once loaded
        const response = NextResponse.redirect(`${protocol}://${host}/spotify/popup`);

        response.cookies.set('spotify_access_token', tokenData.access_token, { 
            httpOnly: true,                                       // invisible to client-side JS, sent only in HTTP requests (prevents XSS token theft)
            secure: process.env.NODE_ENV === 'production',        // HTTPS only in production, HTTP allowed in for local testing
            sameSite: 'lax',                                      // sent on same-site requests + top-level navigations
            path: '/',                                            // available to all routes
            maxAge: tokenData.expires_in                          // 1 hour (as returned by spotify)
        });

        response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 60                             // 60 days in seconds, as refresh tokens are long-lived
        });
        
        return response;
    } catch (error) {
        return NextResponse.json(
            { error: 'Error exchanging code for tokens' }, 
            { status: 500 }
        );
    }
}