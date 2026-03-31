import 'server-only'
import { getClientToken } from "./client";

export async function searchSpotifyImages(query: string) {
    if (!query) return null;

    const tokenData = await getClientToken();

    if (!tokenData) return null;

    const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,album,track&limit=20`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    return data;
}
