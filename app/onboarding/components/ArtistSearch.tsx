"use client";

import React, { useState, useEffect, useRef } from "react";

export interface MBArtist {
    id: string;
    name: string;
}

interface ArtistSearchProps {
    onAddArtist: (artist: MBArtist) => void;
}

export default function ArtistSearch({ onAddArtist }: ArtistSearchProps) {
    const [artistQuery, setArtistQuery] = useState("");
    const [isSearchingArtists, setIsSearchingArtists] = useState(false);
    const [artistSearchResults, setArtistSearchResults] = useState<MBArtist[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const executeSearch = async (searchQuery: string) => {
        const q = searchQuery.trim();
        if (!q) {
            setArtistSearchResults([]);
            setIsSearchingArtists(false);
            return;
        }

        setIsSearchingArtists(true);
        try {
            const res = await fetch(`/api/musicbrainz/artist-search?q=${encodeURIComponent(q)}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                const filteredResults = (data.results || []).filter((artist: MBArtist) =>
                    artist.name.toLowerCase().includes(q.toLowerCase())
                );
                setArtistSearchResults(filteredResults);
            } else {
                setArtistSearchResults([]);
            }
        } catch (err) {
            console.error("Artist search failed", err);
            setArtistSearchResults([]);
        } finally {
            setIsSearchingArtists(false);
        }
    };

    useEffect(() => {
        const q = artistQuery.trim();
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!q || q.length < 2) {
            setArtistSearchResults([]);
            setIsSearchingArtists(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            executeSearch(q);
        }, 400);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [artistQuery]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const q = artistQuery.trim();
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
                    value={artistQuery}
                    onChange={(e) => setArtistQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type an artist name..."
                    aria-label="Search artists"
                    className="input-field"
                    style={{ padding: "12px 14px", width: "100%" }}
                />
            </div>

            {artistQuery.trim() !== "" && (
                <div className="absolute top-full mt-2 w-full bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                    {isSearchingArtists ? (
                        <div className="p-3 text-sm text-[var(--muted)] text-center">Searching...</div>
                    ) : artistSearchResults.length > 0 ? (
                        artistSearchResults.map((artist) => (
                            <button
                                key={artist.id}
                                className="w-full text-left p-3 hover:bg-[rgba(255,255,255,0.05)] transition border-b border-[rgba(255,255,255,0.05)] last:border-b-0"
                                onClick={() => {
                                    onAddArtist({ id: artist.id, name: artist.name });
                                    setArtistQuery("");
                                    setArtistSearchResults([]);
                                }}
                            >
                                <div className="text-white text-sm font-medium">{artist.name}</div>
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
