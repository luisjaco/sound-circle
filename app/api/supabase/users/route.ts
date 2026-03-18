import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);

    const username = searchParams.get('username');
    const id = searchParams.get('id');

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

    if (id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id);

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

    return Response.json(
        { error: 'Bad Request' },
        { status: 400 }
    );
}