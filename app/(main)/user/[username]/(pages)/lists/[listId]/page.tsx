'use server'

import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import { getClient } from "../../../queries";
import { notFound } from "next/navigation";
import ListHeader from "./components/ListHeader";
import ListContent from "./components/ListContent";
import { getSong, getSongs } from "@/lib/spotify/song";

type Song = {
    lists_id: number,
    song_id: number,
    position: number,
    name: string,
    spotify_id?: string,
    spotify_image_url?: string
    artist_id: number,
    artist_name: string,
}

export default async function SpecificListPage({ params }: { params: { username: string, listId: number } }) {
    const { username, listId } = await params
    const supabase = await createClient();

    const [pageUserId, viewingUserId] = await Promise.all([
        getId(username, supabase),
        getClient(supabase)
    ]);

    const owner = pageUserId === viewingUserId;

    return (
        <>
            <Suspense >
                <ListHeaderWrapper
                    supabase={supabase}
                    listId={listId}
                    owner={owner}
                />
            </Suspense>
            <Suspense >
                <ListContentWrapper
                    supabase={supabase}
                    listId={listId}
                    owner={owner}
                />
            </Suspense>
        </>
    )

}

async function ListHeaderWrapper({
    supabase,
    listId,
    owner
}: {
    supabase: SupabaseClient,
    listId: number,
    owner: boolean
}) {

    const { data, error } = await supabase
        .from('user_lists')
        .select(`
            *,
            users (
                id,
                profile_picture_url,
                username,
                name
            )`)
        .eq('id', listId)
        .single()

    if (error) {
        console.error(`error when retrieving data for list (#${listId}).`)
        console.error(error)
        notFound()
    }

    return (<>
        <ListHeader
            id={data.id}
            title={data.title}
            created_at={data.created_at}
            updated_at={data.updated_at}
            user_id={data.user_id}
            cover_image_url={data.cover_image_url}
            description={data.description}
            user_name={data.users.name}
            username={data.users.username}
            profile_picture_url={data.users.profile_picture_url}
            owner={owner}
        />
    </>)
}

async function ListContentWrapper({
    supabase,
    listId,
    owner
}: {
    supabase: SupabaseClient,
    listId: number,
    owner: boolean
}) {

    // fetch list contents with song and album

    const { data, error } = await supabase
        .from('user_lists_content')
        .select(`
            *,
            songs (
                id,
                name,
                spotify_id,
                artist_id,
                artists (
                    id,
                    name
                )
            )`)
        .eq('lists_id', listId)
        .order('position', {ascending: true})

    if (error) {
        console.error(`error when retrieving content for list (#${listId}).`)
        console.error(error)
        notFound()
    }

    const songs = data.map((x) => {
        const s: Song = {
            lists_id: x.lists_id,
            song_id: x.song_id,
            position: x.position,
            name: x.songs.name,
            spotify_id: x.songs.spotify_id,
            artist_id: x.songs.artist_id, 
            artist_name: x.songs.artists.name
        }
        return s;
    })

    const completedSongs = await getSongComponentData(songs);

    return (<>
        <ListContent
            owner={owner}
            songs={completedSongs}
            listId={listId}
        />
    </>)
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


export async function getSongComponentData(songs: Song[]) {
    if (!(songs.length > 0)) return [];

    const spotifyIds = songs.map((x) => x.spotify_id || '').filter((x) => x.length > 0);

    let res = ((songs.length === 1) ? await getSong(spotifyIds[0]) : await getSongs(spotifyIds));
    if (!res) return [];

    const songData = res.tracks;

    // spotify_id : image url
    const validIds: Record<string, string> = { '': '' };
    for (const song of songData) {
        const id = song.id as string
        validIds[id] = song.album.images[0]?.url || '';
    }

    const newSongs: Song[] = []
    for (const song of songs) {
        const songData = { spotify_image_url: song.spotify_id && validIds[song.spotify_id], ...song};
        newSongs.push(songData);
    }

    return newSongs;
}