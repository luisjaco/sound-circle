'use client'

import { useState, useEffect, useRef } from 'react';
import { searchArtists } from '../queries';

type Artist = {
    id: string,
    name: string
}

type Props = {
    favoriteArtists: Artist[];
    setFavoriteArtists: React.Dispatch<React.SetStateAction<Artist[]>>;
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}

export default function Artist(
    {
        favoriteArtists,
        setFavoriteArtists,
        arrowPress,
        setComponentState
    }: Props
) {
    const [artistError, setArtistError] = useState('');
    const [query, setQuery] = useState("");
    const [working, setWorking] = useState(false);
    const [savingArtistId, setSavingArtistId] = useState<string | null>(null);
    const [artistSearchResults, setArtistSearchResults] = useState<Artist[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * When the user clicks an artist from the search results:
     * 1. Call our Supabase artists API with the musicbrainz_id
     * 2. The API checks if the artist already exists — if yes, returns the row; if not, creates one
     * 3. Store the Supabase artist row id in local state so it can be used for user_favorite_artists later
     */
    async function addArtist(artist: { id: string; name: string }) {
        if (!artist || !artist.id) return;
        if (favoriteArtists.some(a => a.id === artist.id) || favoriteArtists.length >= 3) return;

        setSavingArtistId(artist.id);
        setArtistError('');

        try {
            const res = await fetch('/api/supabase/artists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    musicbrainz_id: artist.id,
                    name: artist.name,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to save artist');
            }

            const { artist: dbArtist } = await res.json();

            // Use the Supabase-generated id as the artist id for user_favorite_artists
            setFavoriteArtists((p) => [...p, { id: dbArtist.id, name: artist.name }]);
        } catch (err: any) {
            console.error('Error saving artist to Supabase:', err);
            setArtistError(err.message || 'Failed to save artist. Please try again.');
        } finally {
            setSavingArtistId(null);
        }
    }

    function removeArtist(id: string) {
        setFavoriteArtists((p) => p.filter((x) => x.id !== id));
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const q = query.trim();
            if (q) {
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                executeSearch(q);
            }
        }
    };

    const executeSearch = async (genre: string) => {

        const q = genre.trim(); // trim spaces
        if (!q) {
            setArtistSearchResults([]);
            setWorking(false);
            return;
        }

        setWorking(true);

        const { artists, result } = await searchArtists(q);

        if (!result) {
            setArtistError('There was an error searching for artists.')
        }
        else {
            setArtistSearchResults(artists);
        }

        setWorking(false);
    };


    useEffect(() => {
        const q = query.trim();
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!q || q.length < 2) {
            setArtistSearchResults([]);
            setWorking(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            executeSearch(q);
        }, 400);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [query]);

    useEffect(() => {
        if (arrowPress === 0) return; // skip inital load

        if (favoriteArtists.length === 0) {
            setArtistError('Select at least one artist.');
            setComponentState('failure');
        }
        else {
            setArtistError('');
            setComponentState('success');
        }
    }, [arrowPress])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-white mb-2">Pick up to 3 artists</h2>
                <p className="text-gray-400 text-lg mb-8">Search for artists to follow.</p>

                <div className="mb-6">
                    <label className="text-gray-400 text-sm block mb-3">Search artists</label>

                    <div className="relative">
                        <div className="input-with-icon" style={{ padding: 0 }}>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type an artist name..."
                                aria-label="Search artists"
                                className="w-full bg-[#282828] text-white pl-10 pr-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                                style={{ padding: "12px 14px", width: "100%" }}
                            />
                        </div>

                        {query.trim() !== "" && (
                            <div className="absolute top-full mt-2 w-full bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                                {working ? (
                                    <div className="p-3 text-sm text-(--muted) text-center">Searching...</div>
                                ) : artistSearchResults.length > 0 ? (
                                    artistSearchResults.map((artist) => (
                                        <button
                                            key={artist.id}
                                            disabled={savingArtistId === artist.id}
                                            className="w-full text-left p-3 hover:bg-[rgba(255,255,255,0.05)] transition border-b border-[rgba(255,255,255,0.05)] last:border-b-0 disabled:opacity-50"
                                            onClick={() => {
                                                addArtist({ id: artist.id, name: artist.name });
                                                setQuery("");
                                                setArtistSearchResults([]);
                                            }}
                                        >
                                            <div className="text-white text-sm font-medium">
                                                {savingArtistId === artist.id ? 'Saving...' : artist.name}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-3 text-sm text-(--muted) text-center">No results found</div>
                                )}
                            </div>
                        )}
                    </div>

                </div>

                <div className="space-y-3">
                    {favoriteArtists.length === 0 ? (
                        <p className="text-gray-500 text-sm">No artists chosen yet</p>
                    ) : (
                        <div className='inline-flex'>
                            {
                                favoriteArtists.map((artist) => (
                                    <div
                                        key={artist.id}
                                        className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mx-1.5"
                                    >
                                        <span className="text-white">{artist.name}</span>
                                        <button
                                            onClick={() => removeArtist(artist.id)}
                                            className="text-red-500 hover:text-red-400 text-xl ml-1"
                                        >
                                            x
                                        </button>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                {artistError && (
                    <p className="text-red-500 text-sm mt-2">{artistError}</p>
                )}
            </div>
        </div>
    )
}