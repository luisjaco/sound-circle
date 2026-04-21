// currently only has ISRC search implementation.

import { createClient } from "@/lib/supabase/server";
import { insertSong } from "@/lib/supabase/table/songs";
export async function GET(req: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const isrc = searchParams.get('isrc');
    const artistName = searchParams.get('artistName');
    const songName = searchParams.get('songName');

    if (isrc && artistName && songName) {
        // search for song in SB with isrc
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .eq('isrc', isrc)
            .single()

        if (error?.code === 'PGRST116') {
            const newData = await insertSong(isrc, artistName, songName);

            if (newData) return Response.json(newData);
            else return Response.json(
                { error: "Insertion Error" },
                { status: 418 }
            )
        } else if (data) {
            return Response.json(
                data
            )
        } else {
            return Response.json(
                { error: 'Invalid Query' },
                { status: 500 }
            )
        }
    }

    return Response.json(
        { error: "Invalid Request" },
        { status: 400 }
    )
}