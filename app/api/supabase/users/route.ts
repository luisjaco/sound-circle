import supabase from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url); 

    const username = searchParams.get('username');

    let query = supabase.from('users').select('*');

    // username path
    if (username) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username);

        if (error) {
            console.log(error);
            return Response.json(
                { error: 'Invalid Query' },
                { status: 500 }
            )
        } else {
            return Response.json(data);
        }
    }

    // potential other paths.. by id, age, etc.
    
    // edge case
    return Response.json(
        { error: 'Bad Request' },
        { status: 400}
    );
}