'use client';

import { useState, useEffect, useRef } from 'react';
import { stringToColor } from '@/lib/utils/stringToColor';
import { Heart, Loader2 } from 'lucide-react';

// TYPES

type Genre = {
    id: number;
    genre: string
};

// favorite music item (stored in page state)
// id = local db id, mbId = musicbrainz id (used during search)
type FavoriteItem = {
    id: string;       // supabase id
    mbId: string;     // musicbrainz id 
    name: string;
    subtitle?: string;
    pending?: boolean;
    spotify_image?: string;
};

// search result shape returned by musicbrainz in search routes
type SearchResult = {
    id: string;
    name: string;
    artistName?: string | null;
    artistMbId?: string | null;
    albumMbId?: string | null;
};

type Section = 'artists' | 'albums' | 'songs' | 'genres';

// max favorites per category
const MAX = 3;

// debounced search hook used for every type of search
// wait a moment after typing -> call the corresponding api route
function useDebounceSearch(query: string, section: Section, delay = 400) {
    const [results, setResults] = useState<SearchResult[] | Genre[]>([]);
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
                let url = '';
                if (section === 'artists') url = `/api/musicbrainz/artist?q=${encodeURIComponent(q)}&limit=8`;
                else if (section === 'albums') url = `/api/musicbrainz/album?q=${encodeURIComponent(q)}&limit=8`;
                else if (section === 'songs') url = `/api/musicbrainz/song?q=${encodeURIComponent(q)}&limit=8`;
                else if (section === 'genres') url = `/api/supabase/genres?genre=${encodeURIComponent(q)}`;

                const res = await fetch(url);
                if (!res.ok) throw new Error('Search failed');
                const data = await res.json();

                setResults(section === 'genres' ? (data || []) : (data.results || []));
                setError('');
            } catch {
                setError('There was an error searching.');
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, delay);

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [query, section]);

    return { results, searching, error };
}

// inserts a selected musicbrainz item into the db (if it does not already exist)
// returns the db id that will be used to save favorite items
async function insertAndGetId(
    type: 'artist' | 'album' | 'song',
    mbId: string,
    name: string,
    artistMbId?: string | null,
    artistName?: string | null,
): Promise<string | null> {
    try {
        const res = await fetch('/api/universal-search/insert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                musicbrainzId: mbId,
                name,
                artistMbId: artistMbId || null,
                artistName: artistName || null,
            }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.id ? String(data.id) : null;
    } catch {
        return null;
    }
}

// favorites section component for artists, albums, songs, and genres
// handles search input, search results, and current favorite items
function FavoriteSection({
    title,
    section,
    items,
    onAdd,
    onRemove,
}: {
    title: string;
    section: Section;
    items: FavoriteItem[] | Genre[];
    onAdd: (r: SearchResult | Genre) => void;
    onRemove: (id: string | number) => void;
}) {
    const [query, setQuery] = useState('');
    const { results, searching, error } = useDebounceSearch(query, section);
    const isGenre = section === 'genres';
    const count = items.length;

    return (
        <div className="bg-[#121212] p-5 rounded-2xl border border-[#1e1e1e] shadow-sm">
            <label className="block mb-3 text-sm font-medium text-gray-300">
                {title} <span className="opacity-50">({count}/{MAX})</span>
            </label>

            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                disabled={count >= MAX}
                placeholder={count >= MAX ? 'Maximum 3 selected' : `Search ${title.toLowerCase()}...`}
                className="w-full px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] 
                           focus:outline-none focus:ring-2 focus:ring-[#1DB954]
                           disabled:opacity-40 disabled:cursor-not-allowed transition"
            />

            {/* dropdown */}
            {query.trim() !== '' && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#181818] shadow-lg">
                    {searching ? (
                        <div className="p-3 text-sm opacity-70">Searching...</div>
                    ) : error ? (
                        <div className="p-3 text-red-400 text-sm">{error}</div>
                    ) : results.length > 0 ? (
                        (results as any[]).map((r) => {
                            const label = isGenre ? r.genre : r.name;
                            const sub = !isGenre && r.artistName ? r.artistName : null;

                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => {
                                        onAdd(r);
                                        setQuery('');
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-[#242424] 
                                               transition cursor-pointer flex flex-col"
                                >
                                    <span className="text-sm">{label}</span>
                                    {sub && (
                                        <span className="text-xs opacity-50">{sub}</span>
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <div className="p-3 text-sm opacity-50">No results found</div>
                    )}
                </div>
            )}

            {/* selected items */}
            <div className="mt-4 flex flex-wrap gap-3">
                {items.length === 0 ? (
                    <p className="text-sm opacity-40">None selected</p>
                ) : (
                    (items as any[]).map((item) => {
                        const label = isGenre ? item.genre : item.name;
                        const key = isGenre ? item.id : item.mbId;

                        return (
                            <div
                                key={key}
                                className="flex items-center gap-2 px-3 py-2 rounded-full 
                                           bg-[#1f1f1f] border border-[#2a2a2a] 
                                           hover:bg-[#2a2a2a] transition"
                                style={
                                    isGenre
                                        ? {
                                            backgroundColor:
                                                stringToColor(item.genre) || '#2a2a2a',
                                        }
                                        : undefined
                                }
                            >
                                {!isGenre && (
                                    item.spotify_image ? (
                                        <img
                                            src={item.spotify_image}
                                            className="w-8 h-8 rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-md bg-[#2a2a2a]" />
                                    )
                                )}

                                <span className="text-sm">{label}</span>

                                {!isGenre && item.pending && (
                                    <span className="text-xs opacity-50">saving...</span>
                                )}

                                <button
                                    type="button"
                                    onClick={() => onRemove(key)}
                                    className="ml-1 text-xs opacity-60 hover:opacity-100 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}


// main favorites page component
// loads current favorites, supports adding and removing items, and stores the final selection(s) in the db
export default function Favorites() {
    const [artists, setArtists] = useState<FavoriteItem[]>([]);
    const [albums, setAlbums] = useState<FavoriteItem[]>([]);
    const [songs, setSongs] = useState<FavoriteItem[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [loadError, setLoadError] = useState('');

    // load all current favorites when the page first mounts
    useEffect(() => {
        async function loadFavorites() {
            try {
                const favRes = await fetch('/api/favorites');
                if (!favRes.ok) throw new Error('Failed to load favorites');
                const fav = await favRes.json();

                const artistIds = (fav.favoriteArtists || []).map((a: any) => String(a.id));
                const albumIds = (fav.favoriteAlbums || []).map((a: any) => String(a.id));
                const songIds = (fav.favoriteSongs || []).map((a: any) => String(a.id));

                // build an image lookup request using all the musicbrainz ids we just got
                const imgParams = new URLSearchParams();
                artistIds.forEach((id: string) => imgParams.append('artistId', id));
                albumIds.forEach((id: string) => imgParams.append('albumId', id));
                songIds.forEach((id: string) => imgParams.append('songId', id));

                const imgRes = await fetch(`/api/favorites/images?${imgParams.toString()}`);
                const img = imgRes.ok ? await imgRes.json() : { artists: [], albums: [], songs: [] };

                // convert the image payload into quick lookup maps by db id
                const artistImgMap: Record<string, string> = {};
                for (const a of img.artists || []) artistImgMap[a.id] = a.spotify_image;
                const albumImgMap: Record<string, string> = {};
                for (const a of img.albums || []) albumImgMap[a.id] = a.spotify_image;
                const songImgMap: Record<string, string> = {};
                for (const a of img.songs || []) songImgMap[a.id] = a.spotify_image;

                // convert the loaded favorite payload into the correct shape for this page
                setArtists((fav.favoriteArtists || []).map((a: any) => ({
                    id: String(a.id),
                    mbId: a.musicbrainz_id || String(a.id),
                    name: a.name,
                    spotify_image: artistImgMap[String(a.id)] || '',
                    pending: false,
                })));
                setAlbums((fav.favoriteAlbums || []).map((a: any) => ({
                    id: String(a.id),
                    mbId: a.musicbrainz_id || String(a.id),
                    name: a.name,
                    spotify_image: albumImgMap[String(a.id)] || '',
                    pending: false,
                })));
                setSongs((fav.favoriteSongs || []).map((s: any) => ({
                    id: String(s.id),
                    mbId: s.musicbrainz_id || String(s.id),
                    name: s.name,
                    spotify_image: songImgMap[String(s.id)] || '',
                    pending: false,
                })));
                setGenres(fav.favoriteGenres || []);
            } catch (err) {
                console.error('Failed to load favorites:', err);
                setLoadError('Failed to load favorites. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        }

        loadFavorites();
    }, []);


    // this function creates add handlers for artists, albums and songs
    // it inserts the selected items into the db (if needed), prevents obvious duplicates/max overflow,
    // and updates the item using its db id and resolved spotify artwork
    function makeAdder(
        type: 'artist' | 'album' | 'song',
        setter: React.Dispatch<React.SetStateAction<FavoriteItem[]>>,
    ) {
        return async (result: SearchResult | Genre) => {
            if ('genre' in result) return;
            const r = result as SearchResult;

            const tempId = `pending-${r.id}`;
            let isDuplicate = false;

            // use the latest state in the setter callback so duplicate or max checks are up to date
            setter((prev) => {
                if (prev.some((x) => x.mbId === r.id) || prev.length >= MAX) {
                    isDuplicate = true;
                    return prev;
                }
                return [...prev, {
                    id: tempId,
                    mbId: r.id,
                    name: r.name,
                    subtitle: r.artistName || undefined,
                    pending: true,
                }]
            })

            // await for react to process the setter before checking isDuplicate
            await Promise.resolve();
            if (isDuplicate) return;

            const supabaseId = await insertAndGetId(type, r.id, r.name, r.artistMbId, r.artistName);

            // fetch spotify image for new favorite items (once they exist in the db)
            let spotify_image = '';
            if (supabaseId) {
                try {
                    const paramKey = type === 'artist' ? 'artistId' : type === 'album' ? 'albumId' : 'songId';
                    const imgRes = await fetch(`/api/favorites/images?${paramKey}=${supabaseId}`);

                    if (imgRes.ok) {
                        const imgData = await imgRes.json();
                        const imgList = type === 'artist' ? imgData.artists : type === 'album' ? imgData.albums : imgData.songs;
                        spotify_image = imgList?.[0]?.spotify_image || '';
                    }
                } catch (err) {
                    console.error('Failed to fetch spotify images', err);
                }
            }

            // replace the temporary pending item with the resolved version
            setter((prev) =>
                prev.map((x) =>
                    x.mbId === r.id
                        ? { ...x, id: supabaseId || tempId, pending: false, spotify_image }
                        : x
                )
            );
        };
    }

    const addArtist = makeAdder('artist', setArtists);
    const addAlbum = makeAdder('album', setAlbums);
    const addSong = makeAdder('song', setSongs);

    // genres already exist in the db (simpler)
    function addGenre(result: SearchResult | Genre) {
        if (!('genre' in result)) return;
        if (genres.some((g) => g.id === result.id) || genres.length >= MAX) return;
        setGenres((p) => [...p, result]);
    }

    // remove handlers for each favorites category
    // items are removed by mdId because that is the identifier stored in component state for search matches
    const removeArtist = (mbId: string | number) => setArtists((p) => p.filter((x) => x.mbId !== mbId));
    const removeAlbum = (mbId: string | number) => setAlbums((p) => p.filter((x) => x.mbId !== mbId));
    const removeSong = (mbId: string | number) => setSongs((p) => p.filter((x) => x.mbId !== mbId));
    const removeGenre = (id: string | number) => setGenres((p) => p.filter((x) => x.id !== id));

    // save new selected favorites by replacing the original favorites server-side
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitMessage('');

        const hasPending = [...artists, ...albums, ...songs].some((x) => x.pending);
        if (hasPending) {
            setSubmitMessage('Still saving some items, please wait a moment.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/favorites', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    favoriteGenres: genres.map((g) => g.id),
                    favoriteArtists: artists.map((a) => a.id),
                    favoriteAlbums: albums.map((a) => a.id),
                    favoriteSongs: songs.map((s) => s.id),
                }),
            });

            const data = await res.json();
            setSubmitMessage(res.ok
                ? (data.message || 'Favorites updated successfully.')
                : (data.error || 'Update failed.')
            );
        } catch {
            setSubmitMessage('An unexpected error occurred.');
        } finally {
            setSaving(false);
        }
    }

    // render
    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
        </div>
    )

    return (
        <div className=" text-white flex items-center flex-col w-full px-20">
            <h1 className="text-5xl w-full font-bold pt-15 pb-3 border-b border-gray-800 flex items-center">
                    <Heart className='h-12 w-12 mr-5'/> My Favorites
            </h1>
            <div className="w-full max-w-2xl p-6 space-y-8 mx-auto mt-15">
                {loadError && (
                    <p className="text-red-400 text-sm">{loadError}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <FavoriteSection
                        title="Favorite Artists"
                        section="artists"
                        items={artists}
                        onAdd={addArtist}
                        onRemove={removeArtist}
                    />

                    <FavoriteSection
                        title="Favorite Albums"
                        section="albums"
                        items={albums}
                        onAdd={addAlbum}
                        onRemove={removeAlbum}
                    />

                    <FavoriteSection
                        title="Favorite Songs"
                        section="songs"
                        items={songs}
                        onAdd={addSong}
                        onRemove={removeSong}
                    />

                    <FavoriteSection
                        title="Favorite Genres"
                        section="genres"
                        items={genres}
                        onAdd={addGenre}
                        onRemove={removeGenre}
                    />

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 rounded-xl font-medium 
                               bg-[#1DB954] hover:bg-[#1ed760] 
                               text-black transition 
                               disabled:opacity-50 disabled:cursor-not-allowed 
                               cursor-pointer"
                    >
                        {saving ? 'Saving...' : 'Update Favorites'}
                    </button>

                    {submitMessage && (
                        <p className="text-sm opacity-70 text-center">
                            {submitMessage}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}