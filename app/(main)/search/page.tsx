'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import SearchResultCard, { SearchResultItem } from './components/SearchResultCard';
import { useSearchParams } from 'next/navigation';

interface SearchResponse {
    query: string;
    users: SearchResultItem[];
    artists: SearchResultItem[];
    albums: SearchResultItem[];
    songs: SearchResultItem[];
}

export default function SearchPage() {
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('query') || '');
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // auto-focus the input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setResults(null);
            setHasSearched(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setHasSearched(true);
            try {
                const res = await fetch(`/api/universal-search?q=${encodeURIComponent(query.trim())}`);
                if (res.ok) {
                    const data: SearchResponse = await res.json();
                    setResults(data);
                }
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const totalResults =
        (results?.users.length || 0) +
        (results?.artists.length || 0) +
        (results?.albums.length || 0) +
        (results?.songs.length || 0);

    return (
        <div className="flex flex-col w-2xl mx-auto px-4 py-6 items-center">
            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="flex bg-[#181818] border border-gray-800 rounded-2xl px-4 py-3 focus-within:border-[#1DB954] w-200 h-full transition-colors">
                    <Search className="w-8 h-8 text-gray-500 mr-3 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search users, artists, albums, songs..."
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
                        id="search-input"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="text-gray-500 hover:text-white transition-colors ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
                </div>
            )}

            {/* Results */}
            {!loading && results && (
                <div className="space-y-6">
                    {/* Users */}
                    {results.users.length > 0 && (
                        <ResultSection title="Users" items={results.users} />
                    )}

                    {/* Artists */}
                    {results.artists.length > 0 && (
                        <ResultSection title="Artists" items={results.artists} />
                    )}

                    {/* Albums */}
                    {results.albums.length > 0 && (
                        <ResultSection title="Albums" items={results.albums} />
                    )}

                    {/* Songs */}
                    {results.songs.length > 0 && (
                        <ResultSection title="Songs" items={results.songs} />
                    )}

                    {/* No results */}
                    {totalResults === 0 && hasSearched && (
                        <div className="text-center py-16">
                            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">No results found</p>
                            <p className="text-gray-600 text-sm mt-1">
                                Try a different search term
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!loading && !hasSearched && (
                <div className="text-center py-20">
                    <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                        Search for users, artists, albums, or songs
                    </p>
                </div>
            )}
        </div>
    );
}

function ResultSection({
    title,
    items,
}: {
    title: string;
    items: SearchResultItem[];
}) {
    return (
        <div className='w-2xl'>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
                {title}
            </h2>
            <div className="rounded-2xl bg-[#111111] border border-gray-800/50 overflow-hidden divide-y divide-gray-800/50">
                {items.map((item) => (
                    <SearchResultCard key={`${item.type}-${item.id}`} item={item} />
                ))}
            </div>
        </div>
    );
}