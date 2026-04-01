import supabase from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { addArtistsToSupabase } from '@/lib/supabase/table/artists';

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

        const newArtists = await addArtistsToSupabase(missingArtists);

        if (!newArtists) {
            console.error('Artist insertion error');
            return NextResponse.json(
                { error: 'Failed to insert into artists table' },
                { status: 500 }
            )
        }
        
        allArtists = [...allArtists, ...newArtists];
    }
    return NextResponse.json(allArtists);
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
