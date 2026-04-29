'use client';

import { User, Mic2, Disc3, Music } from 'lucide-react';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import { useRouter } from 'next/navigation';

export type EntityType = 'user' | 'artist' | 'album' | 'song';

export interface SearchResultItem {
    type: EntityType;
    id: string;
    name: string;
    imageUrl: string | null;
    subtitle: string | null;
    source: 'supabase' | 'musicbrainz';
    musicbrainzId?: string;
    artistMbId?: string | null;
}

const typeLabels: Record<EntityType, string> = {
    user: 'User',
    artist: 'Artist',
    album: 'Album',
    song: 'Song',
};

const typeColors: Record<EntityType, string> = {
    user: '#1DB954',
    artist: '#a78bfa',
    album: '#f97316',
    song: '#38bdf8',
};

function TypeIcon({ type, size = 20 }: { type: EntityType; size?: number }) {
    const color = typeColors[type];
    switch (type) {
        case 'user':
            return <User size={size} color={color} />;
        case 'artist':
            return <Mic2 size={size} color={color} />;
        case 'album':
            return <Disc3 size={size} color={color} />;
        case 'song':
            return <Music size={size} color={color} />;
    }
}

export default function SearchResultCard({ item }: { item: SearchResultItem }) {
    const hasImage = item.imageUrl && item.imageUrl.trim() !== '';

    // Build the subtitle text
    let labelText = typeLabels[item.type];
    if ((item.type === 'song' || item.type === 'album') && item.subtitle) {
        labelText = `${typeLabels[item.type]} · ${item.subtitle}`;
    }

    const router = useRouter();

    const handleClick = async () => {
        let routeId = item.id;

        // If it's a user, we want to route to their username instead of their UUID
        if (item.type === 'user' && item.subtitle?.startsWith('@')) {
            routeId = item.subtitle.substring(1);
        }

        // If the item is from MusicBrainz (not yet in Supabase), insert it first
        if (item.source === 'musicbrainz' && item.musicbrainzId) {
            try {
                const res = await fetch('/api/universal-search/insert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: item.type,
                        musicbrainzId: item.musicbrainzId,
                        name: item.name,
                        artistMbId: item.artistMbId || null,
                        artistName: item.subtitle || null,
                    }),
                });
                const data = await res.json();
                if (data.id) {
                    routeId = data.id;
                }
            } catch (err) {
                console.error('Insert error:', err);
                return; // Prevent navigating if we couldn't insert
            }
        }

        router.push(`/${item.type}/${routeId}`);
    };

    return (
        <div
            onClick={handleClick}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
        >
            {/* Image / Fallback icon */}
            <div
                className="shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ background: '#181818' }}
            >
                {hasImage ? (
                    <ImageWithFallback
                        src={item.imageUrl!}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <TypeIcon type={item.type} size={24} />
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate group-hover:text-[#1DB954] transition-colors">
                    {item.name}
                </p>
                <p className="text-sm truncate" style={{ color: '#9aa0a6' }}>
                    {item.type === 'user' && item.subtitle
                        ? item.subtitle
                        : labelText}
                </p>
            </div>
        </div>
    );
}
