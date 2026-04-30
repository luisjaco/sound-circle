import 'server-only';

// ─── Cached Spotify client credentials token ────────────────────────────────
// The client credentials token lasts 3600s (1 hour).
// We cache it in-memory and refresh 5 minutes before expiry.

interface CachedToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    fetchedAt: number; // Date.now() when fetched
}

let cachedToken: CachedToken | null = null;

function isTokenValid(): boolean {
    if (!cachedToken) return false;
    const elapsed = (Date.now() - cachedToken.fetchedAt) / 1000;
    // Refresh 5 minutes (300s) before actual expiry for safety
    return elapsed < cachedToken.expires_in - 300;
}

export async function getClientToken() {
    // Return cached token if still valid
    if (isTokenValid() && cachedToken) {
        return cachedToken;
    }

    const body = new URLSearchParams({
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

    // Cache the token with timestamp
    cachedToken = {
        ...data,
        fetchedAt: Date.now(),
    };

    return cachedToken;
}