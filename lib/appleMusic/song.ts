'use server'
import { getClientToken } from "./client";

export async function searchAppleMusicByISRC(isrc: string, enableFallback: boolean=false, title?: string, artist?: string) {
    const developerToken = await getClientToken();

    const res = await fetch(
        `https://api.music.apple.com/v1/catalog/us/songs?filter[isrc]=${isrc}`,
        {
            headers: {
                Authorization: `Bearer ${developerToken}`,
            },
        }
    );

    if (!res.ok) {
        console.error(`Apple Music API error: ${res.status}`);
        return null;
    }

    const data = await res.json();

    if (data.data[0]) {
        return data.data[0]
    } else if (enableFallback && title && artist) {
        const fallbackResult = await searchAppleMusicFallback(title, artist);
        return fallbackResult
    }

    return null
}

export async function searchAppleMusicFallback(
    title: string,
    artist: string,
) {
    const developerToken = getClientToken();

    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(
        `https://api.music.apple.com/v1/catalog/us/search?term=${query}&types=songs&limit=5`,
        {
            headers: {
                Authorization: `Bearer ${developerToken}`,
            },
        }
    );

    if (!res.ok) {
        console.error(`Apple Music API error: ${res.status}`);
        return;
    }

    const data = await res.json();

    return data.results?.songs?.data?.[0] || null;
}
