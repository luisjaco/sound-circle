import { NextRequest, NextResponse } from "next/server";

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
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', authOptions)
        const tokenData = await tokenResponse.json();

        // return tokens for testing purposes (will be stored more securely in production)
        return NextResponse.json({
            success: true,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error exchanaging code for tokens' }, { status: 500 });
    }
}