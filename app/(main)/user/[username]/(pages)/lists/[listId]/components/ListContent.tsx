'use client'
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { ImageWithFallback } from "@/components/img/ImageWithFallback"
import { Loader2, Menu, Music2, Trash } from "lucide-react"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { useRouter } from "next/navigation"
import { SetStateAction, useEffect, useRef, useState } from "react";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/browser";

type Song = {
    lists_id: number,
    song_id: number,
    position: number,
    name: string,
    spotify_id?: string,
    spotify_image_url?: string,
    artist_id?: number,
    artist_name: string,
}

type ListContentProps = {
    owner: boolean,
    songs: Song[],
    listId: number
}

// search result shape returned by musicbrainz in search routes
type SearchResult = {
    id: string;
    name: string;
    artistName?: string | null;
    artistMbId?: string | null;
    albumMbId?: string | null;
};


export default function ListContent({
    owner,
    songs,
    listId
}: ListContentProps) {

    const router = useRouter();

    const [prevItems, setPrevItems] = useState<Song[]>(songs);
    const [items, setItems] = useState<Song[]>(songs);

    const [editing, setEditing] = useState(false);
    const [changesMade, setChangesMade] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);

    const [query, setQuery] = useState('');

    const [searchToggle, setSearchToggle] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const supabase = createClient();

    const { results, searching, error } = useDebounceSearch(query);

    useEffect(() => {
        if (prevItems.length !== items.length) {
            setChangesMade(true);
            return;
        }

        for (let i = 0; i < prevItems.length; i++) {
            if (prevItems[i].song_id !== items[i].song_id) {
                setChangesMade(true);
                return;
            }
        }

        setChangesMade(false);
    }, [items])

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(i => i.song_id === active.id);
        const newIndex = items.findIndex(i => i.song_id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // update positions
        const updated = newItems.map((item, index) => ({
            ...item,
            position: index + 1
        }));

        setItems(updated);

        // TODO: persist to DB (supabase)
    }

    const toggleEditing = () => {
        if (!editing) {
            setEditing(true);
            return;
        }

        if (!changesMade) {
            setEditing(false);
            return;
        }

        // confirm if user has made changes.
        const ok = window.confirm("Are you sure you want to discard your changes? ALL changes will be lost.");

        if (!ok) return;
        else {
            setItems(prevItems);
            setEditing(false);
            setChangesMade(false);
        }
    }

    const saveChanges = async () => {
        if (!changesMade || saving) return;

        setSaveError(false);
        setSaving(true);

        const ok = await upsert();
        if (!ok) {
            setSaveError(true);
            setSaving(false);
            return;
        }

        // success, update items
        setPrevItems(items);
        setSaving(false);
        setEditing(false);
        setChangesMade(false);
    }

    const upsert = async () => {

        // prepare formatting
        const payload = items.map((item, index) => ({
            lists_id: listId,
            song_id: item.song_id,
            position: index + 1,
        }));

        // match new vs existing
        const existingIds = new Set(prevItems.map((x: any) => x.song_id));
        const newIds = new Set(payload.map(x => x.song_id));

        // find what to delete
        const toDelete = [...existingIds].filter((id) => !newIds.has(id));

        // delete
        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('user_lists_content')
                .delete()
                .eq('lists_id', listId)
                .in('song_id', toDelete);

            if (deleteError) {
                console.error(`there was an error removing songs from list (${listId})`);
                console.error(deleteError);
                return false;
            }
        }

        // upsert, and update 'updated_at' in lists.
        const upsertQuery = supabase
            .from('user_lists_content')
            .upsert(payload, {
                onConflict: 'lists_id, song_id',
            });

        const listQuery = supabase
            .from('user_lists')
            .update({
                updated_at: new Date().toISOString()
            })
            .eq('id', listId)

        const [{ error: upsertError }, { error: listError }] = await Promise.all([upsertQuery, listQuery])
        if (upsertError || listError) {
            console.error(`there was an error upserting songs to list (${listId})`);
            console.error(upsertError);
            return false;
        }

        return true;
    }

    const toggleSearch = () => {
        if (searchToggle) {
            setQuery('');
            setSearchToggle(false);
        } else {
            setSearchToggle(true);
        }
    }

    const addSong = async (result: SearchResult) => {
        const r = result as SearchResult;

        const tempId = `pending-${r.id}`;

        const supabaseId = await insertAndGetId(r.id, r.name, r.artistMbId, r.artistName);

        // fetch spotify image for new favorite items (once they exist in the db)
        let spotify_image = '';
        if (supabaseId) {
            try {
                const imgRes = await fetch(`/api/favorites/images?songId=${supabaseId}`);

                if (imgRes.ok) {
                    const imgData = await imgRes.json();
                    const imgList = imgData.songs;
                    spotify_image = imgList?.[0]?.spotify_image || '';
                }
            } catch (err) {
                console.error('Failed to fetch spotify images', err);
            }
        }

        const newSong: Song = {
            lists_id: listId,
            song_id: (supabaseId !== null) ? supabaseId : -1,
            position: items.length + 1,
            name: r.name,
            spotify_image_url: spotify_image,
            artist_name: r.artistName as string
        }

        console.log(newSong);
        setItems((i) => {return [...i, newSong]})
    };

    const addSongs = (
        <>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                placeholder='Search'
                className={`w-xl text-lg whitespace-pre-wrap font-mono mt-2 wrap-break-words p-1 rounded-lg focus:outline-none
         bg-[#0a0a0a] text-white focus:border-[#1DB954] placeholder-gray-500 transition-colors resize-none min-h-10`}
            />

            {/* search result dropdown */}
            {query.trim() !== '' && (
                <div className="border max-h-48 overflow-y-auto mt-2 rounded-lg bg-[#0a0a0a]">
                    {searching ? (
                        <div className="p-2">Searching...</div>
                    ) : searchError ? (
                        <div className="p-2 text-red-500 text-sm">An error occurred.</div>
                    ) : results.length > 0 ? (
                        (results as any[]).map((r) => {
                            const label = r.name;
                            const sub = r.artistName ? r.artistName : null;
                            return (
                                <button
                                    type="button"
                                    key={r.id}
                                    className="block w-full text-left px-3 py-2 border-b border-white hover:text-[#1DB954] transition-colors"
                                    onClick={() => {
                                        addSong(r);
                                        console.log(r);
                                        setQuery('');
                                    }}
                                >
                                    <span>{label}</span>
                                    {sub && <span className="text-sm opacity-60 ml-2">{sub}</span>}
                                </button>
                            );
                        })
                    ) : (
                        <div className="p-2">No results found</div>
                    )}
                </div>
            )}
        </>
    )

    return (
        <div className="w-5xl flex items-center flex-col mx-auto mt-2">
            <label className="text-red-500" hidden={!saveError}>There was an error saving your list changes.</label>
            <div
                className='flex w-full'
                hidden={!owner}
            >
                <button
                    className="mr-auto text-[#1DB954] hover:text-[#9fddb5]"
                    onClick={toggleEditing}
                >
                    <label className='cursor-pointer text-lg'>{
                        !saving && (editing ? 'Cancel' : 'Edit list')
                    }</label>
                </button>
                <button
                    className="ml-auto text-[#1DB954] hover:text-[#9fddb5]"
                    hidden={!changesMade}
                    onClick={saveChanges}
                >
                    <label className='cursor-pointer text-lg'>{saving ? 'Saving...' : 'Save changes'}</label>
                </button>
            </div>
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={items.map(i => i.song_id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className='w-5xl mx-auto flex flex-col gap-5 mt-5'>
                        {items.map((x) => (
                            <SongEntry
                                key={x.song_id}
                                song={x}
                                router={router}
                                editing={editing}
                                setItems={setItems}
                            />
                        ))}
                    </div>
                </SortableContext>
                <button
                    className="mx-auto text-[#1DB954] hover:text-[#9fddb5] mt-2"
                    hidden={!owner}
                >
                    <label onClick={toggleSearch} className='cursor-pointer text-lg'>{searchToggle ? 'Close' : 'Add more songs'}</label>
                </button>
                {searchToggle && addSongs}
            </DndContext>
        </div>)
}

function SongEntry({
    song,
    router,
    editing,
    setItems,
}: {
    song: Song,
    spotify_image_url?: string,
    router: AppRouterInstance,
    editing: boolean,
    setItems: React.Dispatch<SetStateAction<Song[]>>
}) {
    const { song_id: id, name, position, artist_name: artistName, spotify_image_url } = song;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    const image = (
        <div className="w-24 h-24 rounded-md overflow-hidden ring-2 
        ring-[#1DB954] p-0.5 hover:ring-[#9fddb5] transition-all shrink-0 flex justify-center items-center cursor-pointer"
            onClick={() => router.push(`/song/${id}`)}
        >
            {spotify_image_url ? (
                <ImageWithFallback
                    src={spotify_image_url}
                    alt={`image of song: ${name}`}
                    className="w-full h-full rounded-md object-cover"
                />
            ) : (
                <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center">
                    <Music2 className="w-8 h-8 text-gray-600" />
                </div>
            )}
        </div>
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="bg-[#181818] rounded-lg"
        >
            <div
                className="w-full flex items-center rounded-lg gap-4 p-4 hover:bg-[#282828] transition-colors text-left"
            >
                <span className="text-gray-500 text-sm w-6">{position || '-'}</span>
                {image}
                <div className="flex-1 min-w-0 mb-auto mt-2">
                    <p
                        className="text-white font-bold text-lg truncate cursor-pointer hover:text-[#1DB954] transition-colors"
                        onClick={() => router.push(`/song/${id}`)}
                    >
                        {name}
                    </p>
                    <p
                        className="text-gray-400 text-md italic"
                    >
                        {artistName}
                    </p>
                </div>
                <div
                    {...listeners}
                    className="cursor-grab"
                    hidden={!editing}
                >
                    <Menu className='w-10 h-10 stroke-1' />
                </div>
                <div
                    className='cursor-pointer'
                    hidden={!editing}
                    onClick={() => setItems((e) => {
                        const f = e.filter((s) => s.song_id !== id)

                        // reconstruct positions

                        return f.map((x, i) => { return { ...x, position: i + 1 } })
                    })}
                >
                    <Trash className="w-10 h-10 stroke-1 text-red-400 hover:text-red-600 transition-colors" />
                </div>
            </div>

        </div>
    )
}

// debounced search hook used for every type of search
// wait a moment after typing -> call the corresponding api route
function useDebounceSearch(query: string, delay = 400) {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        const q = query.trim();

        if (!q || q.length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        timerRef.current = setTimeout(async () => {
            try {
                let url = `/api/musicbrainz/song?q=${encodeURIComponent(q)}&limit=8`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();

                setResults(data.results || []);
                setError('');
            } catch {
                setError('There was an error searching.');
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, delay);

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [query]);

    return { results, searching, error };
}

// inserts a selected musicbrainz item into the db (if it does not already exist)
// returns the db id that will be used to save favorite items
async function insertAndGetId(
    mbId: string,
    name: string,
    artistMbId?: string | null,
    artistName?: string | null,
): Promise<number | null> {
    try {
        const res = await fetch('/api/universal-search/insert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'song',
                musicbrainzId: mbId,
                name,
                artistMbId: artistMbId || null,
                artistName: artistName || null,
            }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.id ? data.id : null;
    } catch {
        return null;
    }
}

