import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function Song({ params }: { params: { songId: string } }) {
    const { songId } = await params;

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single()

    // there will be an error is there is not a row from the `single()`
    if (error || !data) {
        console.error(error)
        notFound();
    }

    return (<>
        <p className='text-bold text-green-300'>yes this song exists somewhere...</p>
        <p className='w-lg h-lg'>{JSON.stringify(data, null, '\t')}</p>
    </>)
}