import 'server-only';

export async function getClientToken() {
    const body = new URLSearchParams ({
        grant_type: 'client_credentials',
        client_id: process.env.SPOTIFY_CLIENT_ID as string,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET as string
    });
    
    const res = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            body,
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            }
        }
    )

    const data = await res.json();

    if (!res.ok) {
        console.error('error when retrieving spotify client access token', res);
        return false;
    }

    return data;
}