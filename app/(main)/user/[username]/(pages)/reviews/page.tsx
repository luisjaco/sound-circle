'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Music, Disc3, Loader2, Disc3Icon } from 'lucide-react';
import { UnifiedReview } from '@/lib/types/review';
import Review from "@/components/Review";
import { createClient } from '@/lib/supabase/browser';

type ProfileReviewFilter = 'all' | 'songs' | 'albums';

export default function ReviewsPage() {
    const params = useParams();
    const username = params.username as string;

    const [reviews, setReviews] = useState<UnifiedReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ProfileReviewFilter>('all');
    const [userId, setUserId] = useState<string | null>(null);

    
    // grab logged-in user for comment functionality
    useEffect(() => {
        async function getUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        }
        getUser();
    }, []);

    useEffect(() => {
        async function fetchReviews() {
            if (!username) {
                setReviews([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                queryParams.set('username', username);
                if (filter === 'songs') queryParams.set('type', 'songs');
                if (filter === 'albums') queryParams.set('type', 'albums');

                const res = await fetch(`/api/supabase/reviews?${queryParams.toString()}`);
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
        <div className=" bg-black text-white pb-20">
            <header className='px-20'>
                <h1 className="text-5xl w-full font-bold pt-15 pb-3 border-b border-gray-800 flex items-center">
                    <Disc3Icon className='h-12 w-12 mr-5' /> {`${username}'s Reviews`}
                </h1>
            </header>
            <div className="w-4xl mx-auto px-4 py-6">

                {/* Filter */}
                <div className="flex items-center justify-between mb-6 mt-10">
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
                        {reviews.map((review) => (
                            <Review
                                key={`${review.review_type}-${review.id}`}
                                review={review}
                                showUser={true}
                                userId={userId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>

    )
}