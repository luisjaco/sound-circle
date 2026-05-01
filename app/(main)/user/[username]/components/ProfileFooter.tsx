'use client'

import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import { VinylRating } from '@/components/vinyl-rating';
import { Music, Disc3, Loader2, Settings, Disc3Icon, ListVideo } from 'lucide-react';
import { UnifiedReview } from '@/lib/types/review';
import { useRouter } from 'next/navigation';
import Review from '@/components/Review';

type ProfileReviewFilter = 'all' | 'songs' | 'albums';

export default function ProfileFooter({ username }: { username: string }) {
    const router = useRouter();
    const [reviews, setReviews] = useState<UnifiedReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ProfileReviewFilter>('all');

    useEffect(() => {
        async function fetchReviews() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('username', username);
                if (filter === 'songs') params.set('type', 'songs');
                if (filter === 'albums') params.set('type', 'albums');

                const res = await fetch(`/api/supabase/reviews?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch reviews');

                const data: UnifiedReview[] = await res.json();
                setReviews(data);
            } catch (err) {
                console.error('Error fetching profile reviews:', err);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        }

        fetchReviews();
    }, [username, filter]);

    return (
        <div className="py-6">
            {/* Header / Filter */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Reviews</h3>

                <div className='flex justify-around items-center px-10 gap-10 '>
                    <div 
                        className='flex items-center font-bold text-lg bg-[#111] rounded-lg p-1 border border-gray-800/50 cursor-pointer hover:text-[#1DB954] transition-colorz'
                        onClick={() => router.push(`/user/${username}/reviews`)}    
                    >
                        <Disc3Icon className='h-6 w-6 mr-3' />All Reviews
                    </div>
                    <div 
                        className='flex items-center font-bold text-lg bg-[#111] rounded-lg p-1 border border-gray-800/50 cursor-pointer hover:text-[#1DB954] transition-colors'
                        onClick={() => router.push(`/user/${username}/lists`)}        
                    >
                        <ListVideo className='h-6 w-6 mr-3' />Lists
                    </div>
                </div>

                <div className="flex gap-1 bg-[#111] rounded-lg p-1 border border-gray-800/50">
                    {([
                        { key: 'all' as const, label: 'All' },
                        { key: 'songs' as const, label: 'Songs', icon: Music },
                        { key: 'albums' as const, label: 'Albums', icon: Disc3 },
                    ]).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${filter === key
                                ? 'bg-[#1DB954] text-black '
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {Icon && <Icon className="w-3 h-3" />}
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && reviews.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                        <Music className="w-10 h-10 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">No reviews yet</p>
                </div>
            )}

            {/* Reviews Grid */}
            {!loading && reviews.length > 0 && (
                <div className="grid gap-3">
                    {reviews.map((review) => {
                        const itemName = review.review_type === 'song'
                            ? review.song?.name ?? 'Unknown Song'
                            : review.album?.name ?? 'Unknown Album';

                        const artistName = review.review_type === 'song'
                            ? review.song?.artists?.name ?? 'Unknown Artist'
                            : review.album?.artists?.name ?? 'Unknown Artist';

                        const id = review.id;
                        return (
                            <div
                                key={`${review.review_type}-${review.id}`}
                                className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors cursor-pointer"
                                onClick={() => router.push(`/review/${id}`)}
                            >
                                <div className="flex gap-4">
                                    {/* Art output or placeholder */}
                                    {review.review_type === 'song' && review.song?.cover_art_url ? (
                                        <ImageWithFallback
                                            src={review.song.cover_art_url}
                                            alt={itemName}
                                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-700/50"
                                        />
                                    ) : review.review_type === 'album' && review.album?.cover_art_url ? (
                                        <ImageWithFallback
                                            src={review.album.cover_art_url}
                                            alt={itemName}
                                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-700/50"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 border border-gray-700/50">
                                            {review.review_type === 'song' ? (
                                                <Music className="w-6 h-6 text-gray-500" />
                                            ) : (
                                                <Disc3 className="w-6 h-6 text-gray-500" />
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className='flex justify-between items-center'>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-white font-medium truncate">
                                                        {itemName}
                                                    </h4>
                                                    {/* Type badge */}
                                                    <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${review.review_type === 'song'
                                                        ? 'bg-purple-500/15 text-purple-400'
                                                        : 'bg-blue-500/15 text-blue-400'
                                                        }`}>
                                                        {review.review_type === 'song' ? 'Song' : 'Album'}
                                                    </span>
                                                    {!review.is_public && (
                                                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-gray-400 text-sm mb-2">{artistName}</p>
                                            </div>


                                            {review.rating != null && (
                                                <div className='pr-15'>
                                                    <VinylRating rating={review.rating} size="sm" />
                                                </div>
                                            )}
                                        </div>

                                        {review.review && (
                                            <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                                                {review.review}
                                            </p>
                                        )}

                                        {review.edited_at && (
                                            <p className="text-gray-600 text-[10px] mt-1 italic">edited</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
}