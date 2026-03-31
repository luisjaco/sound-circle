'use client'

import { useState, useEffect } from 'react';
import { Music, Disc3, Loader2 } from 'lucide-react';
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
                <div className="flex gap-1 bg-[#111] rounded-lg p-1 border border-gray-800/50">
                    {([
                        { key: 'all' as const, label: 'All' },
                        { key: 'songs' as const, label: 'Songs', icon: Music },
                        { key: 'albums' as const, label: 'Albums', icon: Disc3 },
                    ]).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 ${filter === key
                                    ? 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
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
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">No reviews yet</p>
                </div>
            )}

            {/* Reviews Grid */}
            {!loading && reviews.length > 0 && (
                <div className="grid gap-3">
                    {reviews.map((review) => (
                        <Review
                            key={`${review.review_type}-${review.id}`}
                            review={review}
                            showUser={false}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}