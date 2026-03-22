import supabase from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { MB_BASE, USER_AGENT } from '@/lib/musicbrainz';

type CompletedArtist = {
    musicbrainz_id: string;
    name: string;
    spotify_id: string;
    apple_music_id: string;
}

type Artist = {
    id: string,
    name: string,
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const artists: Artist[] = body.artists;

    if (!artists) {
        return NextResponse.json(
            { error: "Bad Request" },
            { status: 400 }
        )
    };

    // 1. check which artists in supabase
    const foundArtists = await findArtistIds(
        artists.map((ar) => ar.id)
    );

    if (!foundArtists) {
        console.error('Artist retrieval error');
        return NextResponse.json(
            { error: 'Failed to retrieve artist information' },
            { status: 500 }
        );
    }

    // 2. split into matched and missing artist lists
    const foundIds = foundArtists.map((ar) => ar.musicbrainz_id)
    const missingArtists = artists.filter((x) => !foundIds.includes(x.id));

    let allArtists = foundArtists;
    if (missingArtists) {
        // 3. find relational data
        const completedArtists: CompletedArtist[] = [];
        for (const artist of missingArtists) {
            const { spotifyId, appleId } = await findRelationalData(artist.id);

            const supabaseReadyArtist = {
                musicbrainz_id: artist.id,
                name: artist.name,
                spotify_id: spotifyId as string,
                apple_music_id: appleId as string
            }
            completedArtists.push(supabaseReadyArtist)
        }

        // 4. add artists to supabase table
        if (!(await addArtistsToSupabase(completedArtists))) {
            console.error('Artist insert error');
            return NextResponse.json(
                { error: 'Failed to create artist' },
                { status: 500 }
            );
        }

        // 5. retrieve new artists.
        const newArtists = await findArtistIds(
            completedArtists.map((ar) => ar.musicbrainz_id)
        )

        if (!newArtists) {
            console.error('Artist retrieval error');
            return NextResponse.json(
                { error: 'Failed to retrieve artist information' },
                { status: 500 }
            );
        }


        allArtists = [...allArtists, ...newArtists];
    }
    return NextResponse.json(allArtists);
}

async function findRelationalData(id: string) {
    const url = `${MB_BASE}/artist/${encodeURIComponent(id)}?inc=url-rels&fmt=json`

    const res = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
        },
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('Error found while fetching artist relational data for artist:', id);
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

async function addArtistsToSupabase(artists: CompletedArtist[]) {
    // will insert new artists to supabase, then return a list of the new entries supabase id's
    const { data, error } = await supabase
        .from('artists')
        .insert(artists);

    if (error) {
        return false;
    }

    return true;
}

async function findArtistIds(artistMBIDs: string[]) {
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
