import 'server-only';

import { MB_BASE, USER_AGENT } from '@/lib/musicbrainz';
import supabase from '../admin';
import { fetchPlatformIdsFallback } from '@/lib/platforms';

type Artist = {
    id: string,
    name: string,
}

type CompletedArtist = {
    musicbrainz_id: string;
    name: string;
    spotify_id: string;
    apple_music_id: string;
}

export async function findRelationalData(MBID: string) {
    const url = `${MB_BASE}/artist/${encodeURIComponent(MBID)}?inc=url-rels&fmt=json`

    const res = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
        },
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('Error found while fetching artist relational data for artist:', MBID);
        return { spotifyId: null, appleId: null };
    }

    // Find Spotify link if it exists
    const spotify = data.relations?.find(
        (r: any) => r.url?.resource?.includes('spotify.com/artist')
    );
    const spotifyId = spotify?.url.resource.split('/artist/')[1] ?? null;

    const apple = data.relations?.find(
        (r: any) => r.url?.resource?.includes('music.apple.com')
    );
    const appleId = apple?.url.resource.split('/artist/')[1]?.split('/')[0] ?? null;

    return { spotifyId: spotifyId, appleId: appleId };
}

export async function findArtistIds(artistMBIDs: string[]) {
    // will return a list of ids for a respective artist within supabase given a list of musicbrainz
    // artist ids
    const { data, error } = await supabase
        .from('artists')
        .select('*')
        .in('musicbrainz_id', artistMBIDs)

    if (error) {
        return false;
    }

    // list of responses.
    return data;
}

export async function addArtistsToSupabase(artists: Artist[]) {
    
    // 1. find relational data
    const completedArtists: CompletedArtist[] = [];
    for (const artist of artists) {
        let { spotifyId, appleId } = await findRelationalData(artist.id);

        // Fallback for null ids
        if (!spotifyId || !appleId) {
            const fallback = await fetchPlatformIdsFallback('artist', artist.name);
            if (!spotifyId && fallback.spotifyId) spotifyId = fallback.spotifyId;
            if (!appleId && fallback.appleId) appleId = fallback.appleId;
        }

        const supabaseReadyArtist = {
            musicbrainz_id: artist.id,
            name: artist.name,
            spotify_id: spotifyId || '',
            apple_music_id: appleId || ''
        }
        completedArtists.push(supabaseReadyArtist)
    }

    // 2. add artists to supabase table

    const { data, error } = await supabase
        .from('artists')
        .insert(completedArtists)
    if (error) {
        console.error('Artist insert error');
        return false;
    }

    // 3. retrieve new artists.
    const newArtists = await findArtistIds(
        completedArtists.map((ar) => ar.musicbrainz_id)
    )

    if (!newArtists) {
        console.error('Artist retrieval error');
        return false;
    }

    return newArtists;
}

