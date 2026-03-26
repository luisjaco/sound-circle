import { getClientToken } from "./client";

export async function getSong(songId: string) {
    if (!songId) return false;

    const tokenData = await getClientToken();

    if (!tokenData) return false;

    const res = await fetch(
        `https://api.spotify.com/v1/tracks/${encodeURIComponent(songId)}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify song data of id: ${songId}`);
        console.error(res);
        return false;
    }

    return data;
}

export async function getSongs(songIds: string[]) {
    if (!songIds) return false;

    const tokenData = await getClientToken();

    if (!tokenData) return false;

    const body = new URLSearchParams({ ids: songIds.join(',') })

    const res = await fetch(
        `https://api.spotify.com/v1/tracks?${body.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify song data of ids: ${songIds}`);
        console.error(res);
        return false
    };

    return data;
}
