'use client'

import { useState, useEffect, useRef } from 'react';
import { searchGenres } from '../queries';

type Genre = {
    id: number,
    genre: string
}

type Props = {
    favoriteGenres: Genre[];
    setFavoriteGenres: React.Dispatch<React.SetStateAction<Genre[]>>;
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}

export default function Genre(
    {
        favoriteGenres,
        setFavoriteGenres,
        arrowPress,
        setComponentState
    }: Props
) {
    const [genreError, setGenreError] = useState('');
    const [query, setQuery] = useState('');
    const [working, setWorking] = useState(false);
    const [GenreSearchResults, setGenreSearchResults] = useState<Genre[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    function addGenre(genre: Genre) {
        if (!genre || !genre.id) return;
        if (favoriteGenres.some(a => a.id === genre.id) || favoriteGenres.length >= 3) return;
        setFavoriteGenres((p) => [...p, genre]);
        setGenreError('');
    }

    function removeGenre(id: number) {
        setFavoriteGenres((p) => p.filter((x) => x.id !== id))
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
            setGenreSearchResults([]);
            setWorking(false);
            return;
        }

        setWorking(true);

        const { genres, result } = await searchGenres(q);

        if (!result) {
            setGenreError('There was an error searching for genres.')
        }
        else {
            setGenreSearchResults(genres);
        }

        setWorking(false);
    };

    useEffect(() => {
        const q = query.trim();
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!q || q.length < 2) {
            setGenreSearchResults([]);
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

        if (favoriteGenres.length === 0) {
            setGenreError('Select at least one genre.');
            setComponentState('failure');
        }
        else {
            setGenreError('');
            setComponentState('success');
        }
    }, [arrowPress])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-white mb-2">Pick up to 3 genres</h2>
                <p className="text-gray-400 text-lg mb-8">These help tailor your feed.</p>

                <div className="mb-6">
                    <label className="text-gray-400 text-sm block mb-3">Search genres</label>

                    <div className="relative">
                        <div className="input-with-icon" style={{ padding: 0 }}>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a genre..."
                                aria-label="Search Genres"
                                className="w-full bg-[#282828] text-white pl-10 pr-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                                style={{ padding: "12px 14px", width: "100%" }}
                            />
                        </div>

                        {query.trim() !== "" && (
                            <div className="absolute top-full mt-2 w-full bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                {working ? (
                                    <div className="p-3 text-sm text-(--muted) text-center">Searching...</div>
                                ) : GenreSearchResults.length > 0 ? (
                                    GenreSearchResults.map((Genre) => (
                                        <button
                                            key={Genre.id}
                                            className="w-full text-left p-3 hover:bg-[rgba(255,255,255,0.05)] transition border-b border-[rgba(255,255,255,0.05)] last:border-b-0"
                                            onClick={() => {
                                                addGenre({ id: Genre.id, genre: Genre.genre });
                                                setQuery("");
                                                setGenreSearchResults([]);
                                            }}
                                        >
                                            <div className="text-white text-sm font-medium">{Genre.genre}</div>
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
                    {favoriteGenres.length === 0 ? (
                        <p className="text-gray-500 text-sm">No genres chosen yet</p>
                    ) : (
                        <div className='inline-flex'>
                            {
                                favoriteGenres.map((genre) => (
                                    <div
                                        key={genre.id}
                                        className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mx-1.5"
                                    >
                                        <span className="text-white">{genre.genre}</span>
                                        <button
                                            onClick={() => removeGenre(genre.id)}
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

                {genreError && (
                    <p className="text-red-500 text-sm mt-2">{genreError}</p>
                )}
            </div>
        </div>
    )
}