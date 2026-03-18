import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if(!clientId || !clientSecret) {
        return NextResponse.json({ error: "Missing Spotify credentials"}, { status: 500 });
    }

    // read refresh token from incoming request cookies
    const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

    if(!refreshToken) {
        return NextResponse.json({ error: "No refresh token found"}, { status: 401 });
    }

    try {
        // exchange refresh token for a new access token
        const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    if (!response.ok) {
        return NextResponse.json({ error: 'Spotify refresh failed'}, { status: 401 });
    }

    const tokenData = await response.json();

    // attach the new access token to the response
    const nextResponse = NextResponse.json({ success: true });

    nextResponse.cookies.set('spotify_access_token', tokenData.access_token, {
        httpOnly: true,                                         // invisible to client-side JS, sent only in http requests (prevents xss token theft)
        secure: process.env.NODE_ENV === 'production',          // https only in production, http allowed in for local testing
        sameSite: 'lax',                                        // sent on same-site requests + top-level navigations
        path: '/',                                              // available to all routes
        maxAge: tokenData.expires_in                            // 1 hour (as returned by spotify)
    });

    // update refresh token if new one is sent by spotify
    if(tokenData.refresh_token) {
        nextResponse.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 60                               // 60 days in seconds, as refresh tokens are long-lived
        });
    }
    
    return nextResponse;

    } catch (error) {
        return NextResponse.json({ error: 'Token refresh error' }, { status: 500 });
    }
}