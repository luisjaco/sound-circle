"use client"
import { UnifiedReview } from "@/lib/types/review";
import Link from "next/link";
import { ImageWithFallback } from "./img/ImageWithFallback";
import { VinylRating } from "./vinyl-rating";
import { Music, Disc3, Flag } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const FLAG_REASONS = [
    'Spam',
    'Harassment',
    'Hate Speech',
    'Inappropriate Content',
    'Other',
]

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

// flag modal component
function FlagModal({
    onClose,
    onSubmit,
    submitting,
    submitError,
    submitSuccess,
}: {
    onClose: () => void;
    onSubmit: (reason: string) => void;
    submitting: boolean;
    submitError: string;
    submitSuccess: boolean;
}) {
    const [selectedReason, setSelectedReason] = useState('');
    const [otherText, setOtherText] = useState('');
 
    const handleSubmit = () => {
        const reason = selectedReason === 'Other' ? otherText.trim() : selectedReason;
        if (!reason) return;
        onSubmit(reason);
    };
        return (
        // backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={onClose}
        >
            {/* modal */}
            <div
                className="bg-[#181818] border border-gray-800 rounded-xl p-6 w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-white font-semibold text-lg mb-4">Report Review</h2>
 
                {submitSuccess ? (
                    <div className="text-center py-4">
                        <p className="text-[#1DB954] font-medium">Report submitted successfully.</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-400 text-sm mb-4">Select a reason for reporting this review:</p>
 
                        <div className="space-y-2 mb-4">
                            {FLAG_REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setSelectedReason(reason)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                                        selectedReason === reason
                                            ? 'border-[#1DB954] bg-[#1DB954]/10 text-white'
                                            : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                                    }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
 
                        {selectedReason === 'Other' && (
                            <textarea
                                value={otherText}
                                onChange={(e) => setOtherText(e.target.value)}
                                placeholder="Describe the issue..."
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-[#1DB954] mb-4"
                                rows={3}
                            />
                        )}
 
                        {submitError && (
                            <p className="text-red-400 text-sm mb-3">{submitError}</p>
                        )}
 
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedReason || (selectedReason === 'Other' && !otherText.trim()) || submitting}
                                className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function FeedReviewCard({
    review,
    showUser }: {
        review: UnifiedReview,
        showUser: boolean
    }) {

    const router = useRouter();

    const [showFlagModal, setShowFlagModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

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

        const handleFlagClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSubmitSuccess(false);
        setSubmitError('');
        setShowFlagModal(true);
    };
 
    const handleFlagSubmit = async (reason: string) => {
        setSubmitting(true);
        setSubmitError('');
        try {
            const type = review.review_type === 'song' ? 'song_review' : 'album_review';
            const res = await fetch('/api/moderation/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    reviewId: review.id,
                    reason,
                }),
            });
 
            const data = await res.json();
 
            if (!res.ok) {
                setSubmitError(data.error || 'Failed to submit report.');
            } else {
                setSubmitSuccess(true);
            }
        } catch {
            setSubmitError('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

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
        <div className="flex gap-4 mb-3">
            {review.review_type === "song" && review.song?.cover_art_url ? (
                <ImageWithFallback
                    src={review.song.cover_art_url}
                    alt={itemName}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-700/50"
                />
            ) : review.review_type === "album" && review.album?.cover_art_url ? (
                <ImageWithFallback
                    src={review.album.cover_art_url}
                    alt={itemName}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-700/50"
                />
            ) : (
                <div className="w-16 h-16 rounded-lg bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 border border-gray-700/50">
                    {review.review_type === "song" ? (
                        <Music className="w-7 h-7 text-gray-500" />
                    ) : (
                        <Disc3 className="w-7 h-7 text-gray-500" />
                    )}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate text-[15px]">
                    {itemName}
                </h3>
                <p className="text-gray-400 text-sm">{artistName}</p>
                {review.rating != null && (
                    <div className="mt-1.5">
                        <VinylRating rating={review.rating} size="sm" />
                    </div>
                )}
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
                className='flex border border-gray-800/50 bg-[#181818] rounded-xl p-5 hover:bg-[#1f1f1f] transition-all duration-200 cursor-pointer'>
                <div className="w-full">

                    {showUser && (userHeader)}

                    {/* Song/Album info */}
                    {mediaInfo}

                    {/* Review text */}
                    {review.review && (
                        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                            {review.review}
                        </p>
                    )}

                    {/* Edited indicator + flag button */}
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
                </div>
            </div>
        </>
    );
}