import { createClient } from "@/lib/supabase/server";
import { getClient, getProfile } from "../../queries";
import { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Page from "./components/Page";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getSong, getSongs } from "@/lib/spotify/song";


export default async function Lists({ params }: { params: { username: string } }) {
    const { username } = await params;
    return (
        <Suspense
            fallback={(
                <div className="flex flex-col w-full h-full my-100 items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
                    <p className="text-gray-500 text-sm">Loading lists...</p>
                </div>
            )}
        >
            <PageWrapper
                username={username}
            />
        </Suspense >
    )
}

async function getId(username: string, supabase: SupabaseClient) {
    // retrieve page user id
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

    if (error) {
        console.error(`error when finding viewingUserId with username (${username})`);
        notFound();
    }

    return data.id;
}

async function PageWrapper({ username }: { username: string }) {
    const supabase = await createClient();

    const [pageUserId, viewingUserId] = await Promise.all([
        getId(username, supabase),
        getClient(supabase)
    ]);
    const owner = pageUserId === viewingUserId;

    const { data, error } = await supabase
        .from('user_lists')
        .select(`*`)
        .eq('user_id', pageUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`error when retrieving lists for userId (${pageUserId})`);
        console.error(error)
        notFound();
    }

    return (
        <Page
            owner={owner}
            username={username}
            lists={data}
        />
    );
}