import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
    // authorization code sent by spotify after user authorizes the app
    const code = request.nextUrl.searchParams.get('code');

    // sanity check
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
    // include auth code and client secret to verify user and app identity to spotify
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

    // call spotify's token endpoint and exchange the auth code for access and refresh tokens
    try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', authOptions);
        
        if(!tokenResponse.ok) {
            return NextResponse.json({ error: 'Spotify token request failed' }, { status: 500 });
        }
        
        const tokenData = await tokenResponse.json();
        
        // TODO: get actual user_id from session
        const userId = '56f2c405-69b6-4942-b37d-20ed7ce17d5c';

        // store tokens in database
        const { error } = await supabase
            .from('user_tokens')
            .upsert({
                user_id: userId,
                platform: 'spotify',
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_in: new Date(Date.now() + tokenData.expires_in * 1000).toISOString() // calculate expiry time
            }, { 
                onConflict: 'user_id,platform' 
            });
        if (error) {
            console.error('Supabase upsert error:', error);
            return NextResponse.json({ error: 'Failed to store tokens' }, { status: 500 });
        }

        return NextResponse.redirect(new URL('/onboarding?step=4', request.url));
    } catch (error) {
        return NextResponse.json(
            { error: 'Error exchanging code for tokens' }, 
            { status: 500 }
        );
    }
}