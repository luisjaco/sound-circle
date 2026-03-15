"use client";

import React, { useState, useEffect, useRef } from "react";

export interface SBGenre {
    id: number;
    genre: string;
}

interface GenreSearchProps {
    onAddGenre: (Genre: SBGenre) => void;
}

export default function GenreSearch({ onAddGenre }: GenreSearchProps) {
    const [GenreQuery, setGenreQuery] = useState("");
    const [isSearchingGenres, setIsSearchingGenres] = useState(false);
    const [GenreSearchResults, setGenreSearchResults] = useState<SBGenre[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const executeSearch = async (searchQuery: string) => {
        const q = searchQuery.trim();
        if (!q) {
            setGenreSearchResults([]);
            setIsSearchingGenres(false);
            return;
        }

        setIsSearchingGenres(true);
        try {
            const res = await fetch(`/api/supabase/genres?genre=${encodeURIComponent(q)}`);
            
            if (res.ok) {
                const data = await res.json();
                const filteredResults = (data || []).filter((Genre: SBGenre) =>
                    Genre.genre.toLowerCase().includes(q.toLowerCase())
                );
                setGenreSearchResults(filteredResults);
            } else {
                setGenreSearchResults([]);
            }
        } catch (err) {
            console.error("Genre search failed", err);
            setGenreSearchResults([]);
        } finally {
            setIsSearchingGenres(false);
        }
    };

    useEffect(() => {
        const q = GenreQuery.trim();
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!q || q.length < 2) {
            setGenreSearchResults([]);
            setIsSearchingGenres(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            executeSearch(q);
        }, 400);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [GenreQuery]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const q = GenreQuery.trim();
            if (q) {
                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                executeSearch(q);
            }
        }
    };

    return (
        <div className="relative">
            <div className="input-with-icon" style={{ padding: 0 }}>
                <input
                    value={GenreQuery}
                    onChange={(e) => setGenreQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a genre..."
                    aria-label="Search Genres"
                    className="input-field"
                    style={{ padding: "12px 14px", width: "100%" }}
                />
            </div>

            {GenreQuery.trim() !== "" && (
                <div className="absolute top-full mt-2 w-full bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                    {isSearchingGenres ? (
                        <div className="p-3 text-sm text-[var(--muted)] text-center">Searching...</div>
                    ) : GenreSearchResults.length > 0 ? (
                        GenreSearchResults.map((Genre) => (
                            <button
                                key={Genre.id}
                                className="w-full text-left p-3 hover:bg-[rgba(255,255,255,0.05)] transition border-b border-[rgba(255,255,255,0.05)] last:border-b-0"
                                onClick={() => {
                                    onAddGenre({ id: Genre.id, genre: Genre.genre });
                                    setGenreQuery("");
                                    setGenreSearchResults([]);
                                }}
                            >
                                <div className="text-white text-sm font-medium">{Genre.genre}</div>
                            </button>
                        ))
                    ) : (
                        <div className="p-3 text-sm text-[var(--muted)] text-center">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
}
