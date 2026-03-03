import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if ( error ) {
        return Response.json(
            { error: 'Invalid Query' },
            { status: 500 }
        )
    } else {
        return Response.json( 
            data
        )
    }
}
