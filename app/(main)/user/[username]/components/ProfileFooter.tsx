'use client'

import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import { VinylRating } from '@/components/vinyl-rating';
import { useRouter } from 'next/navigation';

export default function ProfileFooter() {
    const router = useRouter();
    const userReviews = [
        {
            id: 1,
            albumArt:
                "https://images.unsplash.com/photo-1616663395403-2e0052b8e595?w=400",
            albumTitle: "Midnight Echoes",
            artistName: "The Velvet Underground",
            rating: 5,
            reviewText:
                "An absolute masterpiece. The production is flawless and every track tells a story.",
            likes: 127,
            comments: 23,
        },
        {
            id: 2,
            albumArt:
                "https://images.unsplash.com/photo-1703115015343-81b498a8c080?w=400",
            albumTitle: "Neon Nights",
            artistName: "Synthwave Society",
            rating: 5,
            reviewText: "Pure 80s nostalgia done right. The synth work is incredible.",
            likes: 203,
            comments: 41,
        },
        {
            id: 3,
            albumArt:
                "https://images.unsplash.com/photo-1681148773098-1460911e25a4?w=400",
            albumTitle: "Jazz After Dark",
            artistName: "Miles Ahead Quartet",
            rating: 4,
            reviewText:
                "Stunning jazz fusion that pushes boundaries while respecting tradition.",
            likes: 156,
            comments: 28,
        },
        {
            id: 4,
            albumArt:
                "https://images.unsplash.com/photo-1761814684971-fa0e7fd606e2?w=400",
            albumTitle: "Summer Vibes",
            artistName: "Coastal Dreams",
            rating: 3,
            reviewText:
                "Pleasant but forgettable. Good background music for summer parties.",
            likes: 45,
            comments: 12,
        },
    ];

    return (
        <div className="py-6">
            <h3 className="text-white font-bold mb-4">My Reviews</h3>
            <div className="grid gap-3">
                {userReviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors cursor-pointer"
                        onClick={() => router.push("/comments")}
                    >
                        <div className="flex gap-4">
                            <ImageWithFallback
                                src={review.albumArt}
                                alt={review.albumTitle}
                                className="w-16 h-16 rounded-md object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate mb-1">{review.albumTitle}</h4>
                                <p className="text-gray-400 text-sm mb-2">{review.artistName}</p>
                                <VinylRating rating={review.rating} size="sm" />
                                <p className="text-gray-300 text-sm mt-2 line-clamp-2">{review.reviewText}</p>
                                <div className="flex gap-4 mt-2 text-gray-500 text-xs">
                                    <span>{review.likes} likes</span>
                                    <span>{review.comments} comments</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}