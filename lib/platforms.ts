import 'server-only';
import jwt from 'jsonwebtoken';
import { searchSpotifyImages } from '@/lib/spotify/search';

export function getAppleDeveloperToken() {
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

    if (!teamId || !keyId || !privateKeyRaw) {
        return null;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    return jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '1h',
        issuer: teamId,
        header: {
            alg: 'ES256',
            kid: keyId
        }
    });
}

export async function fetchPlatformIdsFallback(
    type: 'artist' | 'album' | 'song',
    name: string,
    artistName: string | null = null
) {
    let spotifyId: string | null = null;
    let appleId: string | null = null;

    const query = artistName ? `${name} ${artistName}` : name;

    await Promise.all([
        fetchSpotify(type, query, spotifyId),
        fetchAppleMusic(type, query, appleId)
    ]);

    return { spotifyId, appleId };
}

async function fetchSpotify(type: string, query: string, spotifyId: string | null) {
    // 1. Spotify
    try {
        const spotifyData = await searchSpotifyImages(query);
        if (spotifyData) {
            if (type === 'artist' && spotifyData.artists?.items?.length > 0) {
                spotifyId = spotifyData.artists.items[0].id;
            } else if (type === 'album' && spotifyData.albums?.items?.length > 0) {
                spotifyId = spotifyData.albums.items[0].id;
            } else if (type === 'song' && spotifyData.tracks?.items?.length > 0) {
                spotifyId = spotifyData.tracks.items[0].id;
            }
        }
    } catch (e) {
        console.error('Failed to fetch Spotify ID fallback', e);
    }
}

async function fetchAppleMusic(type: string, query: string, appleId: string | null) {
    // 2. apple music
    try {
        const devToken = getAppleDeveloperToken();
        if (devToken) {
            const appleType = type === 'song' ? 'songs' : type === 'album' ? 'albums' : 'artists';
            const url = `https://api.music.apple.com/v1/catalog/us/search?types=${appleType}&limit=1&term=${encodeURIComponent(query)}`;

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${devToken}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (type === 'artist' && data.results?.artists?.data?.length > 0) {
                    appleId = data.results.artists.data[0].id;
                } else if (type === 'album' && data.results?.albums?.data?.length > 0) {
                    appleId = data.results.albums.data[0].id;
                } else if (type === 'song' && data.results?.songs?.data?.length > 0) {
                    appleId = data.results.songs.data[0].id;
                }
            }
        }
    } catch (e) {
        console.error('Failed to fetch Apple Music ID fallback', e);
    }
}