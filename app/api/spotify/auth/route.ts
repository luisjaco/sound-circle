import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    
    // log the values (for testing)
    console.log(`REDIRECT_URI=[${redirectUri}]`);
    console.log("CLIENT_ID exists: ", clientId !== undefined);

    // permissions we are requesting from the user (listening history and top artists/tracks)
    const scopes = [
        'user-read-recently-played',
        'user-top-read',
    ].join(' ');

    // build the authorization request url
    const params = new URLSearchParams({
        client_id: clientId!,
        response_type: 'code',
        redirect_uri: redirectUri!,
        scope: scopes,
    });
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log('Full Spotify Auth URL: ', spotifyAuthUrl);

    // redirect user to spotify's auth page, where they log in and accept the requested permissions
    return NextResponse.redirect(spotifyAuthUrl);
}