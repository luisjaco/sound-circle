import { cookies } from "next/headers";

// return spotify tokens from cookies (or null if not found)

export async function getSpotifyTokens() {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get('spotify_access_token')?.value;
    const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

    if(!accessToken || !refreshToken) {
        return null;
    }

    return { accessToken, refreshToken };
}

// use this for every spotify api call instead of raw fetch
// will automatically 401s by refreshing the access token and retrying once
export async function spotifyFetch(url: string, options: RequestInit = {}, retry = true): Promise<Response> {
    const tokens = await getSpotifyTokens();

    if(!tokens) {
        throw new Error("No Spotify tokens found");
    }

    // first atempt with current access token
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${tokens.accessToken}`
        }
    });

    // anything other than 401 is returned directly (success or non-auth error)
    if(response.status !== 401) {
        return response;
    }

    // if access token expired, call the refresh endpoint to get a new one
    const refreshResponse = await fetch('/api/spotify/refresh', { method: 'POST' });
    
    if(!refreshResponse.ok) {
        // refresh token is also invalid, user needs to reconnect spotify
        throw new Error("Spotify session expired, please reconnect");
    }

    // fetch the updated tokens and retry the original request once
    const newTokens = await getSpotifyTokens();

    if(!newTokens) {
        throw new Error('Failed to retrieve refreshed tokens');
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${newTokens.accessToken}`
        }
    });
}