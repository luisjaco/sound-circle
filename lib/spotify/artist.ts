import 'server-only'
import { getClientToken } from "./client";

export async function getArtist(artistId: string) {
    if (!artistId) return false;

    const tokenData = await getClientToken();

    if (!tokenData) return false;

    const res = await fetch(
        `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify artist data of id: ${artistId}`);
        console.error(res);
        return false;
    }

    return { artists: [ data ] }
}

export async function getArtists(artistIds: string[]) {
    if (!artistIds) return false;

    const tokenData = await getClientToken();

    if (!tokenData) return false;

    const body = new URLSearchParams({ ids: artistIds.join(',') })

    const res = await fetch(
        `https://api.spotify.com/v1/artists?${body.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify artist data of ids: ${artistIds}`);
        console.error(res);
        return false;
    };

    return data
}