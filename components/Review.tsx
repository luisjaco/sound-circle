"use client"
import { UnifiedReview } from "@/lib/types/review";
import Link from "next/link";
import { ImageWithFallback } from "./img/ImageWithFallback";
import { VinylRating } from "./vinyl-rating";
import ReviewComments from "./ReviewComments";
import { Music, Disc3, Flag } from "lucide-react";
import { useRouter } from 'next/navigation';
import { FlagModal } from './FlagModal';
import { useFlagReview } from '@/hooks/useFlagReview';

function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 52) return `${diffWeeks}w`;
    return then.toLocaleDateString();
}

export default function FeedReviewCard({
    review,
    showUser,
    userId }: {
        review: UnifiedReview,
        showUser: boolean,
        userId?: string | null
    }) {

    const router = useRouter();

    const {
        showFlagModal,
        setShowFlagModal,
        submitting,
        submitError,
        submitSuccess,
        handleFlagClick,
        handleFlagSubmit,
    } = useFlagReview(review.id, review.review_type);

    const itemName =
        review.review_type === "song"
            ? review.song?.name ?? "Unknown Song"
            : review.album?.name ?? "Unknown Album";

    const artistName =
        review.review_type === "song"
            ? review.song?.artists?.name ?? "Unknown Artist"
            : review.album?.artists?.name ?? "Unknown Artist";

    const effectiveDate = review.edited_at || review.created_at;
    const timeAgo = getTimeAgo(effectiveDate);

    const pushToProfile = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();

        router.push(`/user/${review.user.username}`);
    }

    const userHeader = (
        <div className="flex items-center gap-3 mb-4">
            <div
                onClick={pushToProfile}
            >
                {review.user.profile_picture_url ? (
                    <ImageWithFallback
                        src={review.user.profile_picture_url}
                        alt={review.user.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all">
                        <span className="text-white font-bold text-sm">
                            {review.user.username.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div
                        onClick={pushToProfile}
                        className="text-white font-medium hover:text-[#1DB954] transition-colors truncate"
                    >
                        {review.user.name || review.user.username}
                    </div>
                    <span className="text-gray-500 text-xs shrink-0">•</span>
                    <span className="text-gray-500 text-xs shrink-0">{timeAgo}</span>
                </div>
                <p className="text-gray-500 text-xs">
                    @{review.user.username}
                </p>
            </div>
            {/* Review type badge */}
            <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${review.review_type === "song"
                    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    }`}
            >
                {review.review_type === "song" ? (
                    <Music className="w-3 h-3" />
                ) : (
                    <Disc3 className="w-3 h-3" />
                )}
                {review.review_type === "song" ? "Song" : "Album"}
            </div>
        </div>
    )

    const mediaInfo = (
        <div className="flex gap-5 mb-4 relative z-10">
            {review.review_type === "song" && review.song?.cover_art_url ? (
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#1DB954]/20 blur-xl rounded-full scale-90 group-hover:bg-[#1DB954]/30 group-hover:scale-100 transition-all duration-500"></div>
                    <ImageWithFallback
                        src={review.song.cover_art_url}
                        alt={itemName}
                        className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover border border-white/10 shadow-2xl"
                    />
                </div>
            ) : review.review_type === "album" && review.album?.cover_art_url ? (
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#1DB954]/20 blur-xl rounded-full scale-90 group-hover:bg-[#1DB954]/30 group-hover:scale-100 transition-all duration-500"></div>
                    <ImageWithFallback
                        src={review.album.cover_art_url}
                        alt={itemName}
                        className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover border border-white/10 shadow-2xl"
                    />
                </div>
            ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                    {review.review_type === "song" ? (
                        <Music className="w-8 h-8 text-gray-600" />
                    ) : (
                        <Disc3 className="w-8 h-8 text-gray-600" />
                    )}
                </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                        <h3 className="text-white font-bold truncate text-[17px] md:text-xl tracking-tight mb-0.5 group-hover:text-[#1DB954] transition-colors duration-300">
                            {itemName}
                        </h3>
                        <p className="text-gray-400 font-medium text-sm md:text-[15px] truncate">
                            {artistName}
                        </p>
                        
                    </div>
                    
                    {/* Vinyl Rating Badge */}
                    {review.rating != null && (
                        <div className="flex flex-col items-end shrink-0">
                            <div className="flex items-center bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 backdrop-blur-md shadow-inner">
                                <VinylRating rating={review.rating} size="md" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )


    return (
        <>
            {showFlagModal && (
                <FlagModal
                    onClose={() => setShowFlagModal(false)}
                    onSubmit={handleFlagSubmit}
                    submitting={submitting}
                    submitError={submitError}
                    submitSuccess={submitSuccess}
                />
            )}
            <div 
                onClick={() => router.push(`/review/${review.id}`)}
                className='relative flex flex-col border border-white/5 bg-[#121212]/80 backdrop-blur-xl rounded-2xl p-5 hover:bg-[#151515] transition-all duration-300 cursor-pointer overflow-hidden group shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'>
                
                {/* Atmospheric Background Glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#1DB954]/5 rounded-full blur-[80px] group-hover:bg-[#1DB954]/10 transition-colors duration-700 pointer-events-none z-0" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] group-hover:bg-purple-500/10 transition-colors duration-700 pointer-events-none z-0" />
                
                <div className="relative z-10">
                    {showUser && (userHeader)}

                        {/* Song/Album info */}
                        {mediaInfo}

                    {/* Review text */}
                    {review.review && (
                        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                            {review.review}
                        </p>
                    )}

                    {/* Edited indicator */}
                    <div className="flex items-center justify-between mt-2">
                        {review.edited_at ? (
                            <p className="text-gray-600 text-xs italic">edited</p>
                        ) : (
                            <div />
                        )}
                        <button
                            onClick={handleFlagClick}
                            className="flex items-center gap-1 text-gray-600 hover:text-red-400 transition-colors text-xs"
                        >
                            <Flag className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {/* Comments section taking full width */}
                    <div className="w-full mt-2" onClick={(e) => e.stopPropagation()}>
                        <ReviewComments reviewId={review.id} userId={userId ?? null} />
                    </div>
                </div>
            </div>
        </>
    );
}