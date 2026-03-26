import 'server-only';
import { getClientToken } from "./client";

export async function getAlbum(albumId: string) {
    if (!albumId) return false;

    const tokenData = await getClientToken();

    if (!tokenData) return false;

    const res = await fetch(
        `https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify album data of id: ${albumId}`);
        console.error(res);
        return false;
    }

    return { albums: [ data ] };
}

export async function getAlbums(albumIds: string[]) {
    if (!albumIds) return false;

    const tokenData = await getClientToken();

    if (!tokenData) return false;

    const body = new URLSearchParams({ ids: albumIds.join(',') })

    const res = await fetch(
        `https://api.spotify.com/v1/albums?${body.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify album data of ids: ${albumIds}`);
        console.error(res);
        return false;
    };

    return data;
}   
