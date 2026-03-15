import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);

    let genre = searchParams.get('genre');

    if ( genre ) {
        genre = genre.trim();
        const { data, error } = await supabase
            .from('genres')
            .select('*')
            .ilike('genre', `%${genre}%`);
        
        if ( error ) {
            return Response.json(
                { error: "Invalid Query" },
                { status: 500 }
            )
        } else {
            return Response.json(
                data
            )
        }
    }

    // all genre (not optimal)
    const { data, error } = await supabase
        .from('genres')
        .select('*');

    if ( error ) {
        return Response.json(
            { error: "Invalid Query" },
            { status: 500 }
        )
    } else {
        return Response.json(
            data
        )
    }
}