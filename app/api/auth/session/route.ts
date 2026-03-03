import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if ( error ) {
        return Response.json(
            { error: 'Bad Query' },
            { status: 500 }
        )
    } else {
        console.log(data);
        return Response.json( 
            data
        )
    }
}
