'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, Pencil, X, Check, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import UpvoteButton from './UpvoteButton';

// Turns a timestamp into a "2h ago" style string
function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 52) return `${diffWeeks}w ago`;
    return then.toLocaleDateString();
}

interface CommentUser {
    id: string;
    username: string;
    name: string | null;
    profile_picture_url: string | null;
}

interface ReviewComment {
    id: number;
    created_at: string;
    edited_at: string | null;
    content: string;
    is_flagged: boolean;
    user_id: string;
    review_id: number;
    users: CommentUser | null;
}

interface ReviewCommentsProps {
    reviewId: number;
    userId: string | null; // currently logged-in user, null if not logged in
    defaultExpanded?: boolean; // if true, show comments + input right away (used on the review detail page)
}

export default function ReviewComments({ reviewId, userId, defaultExpanded = false }: ReviewCommentsProps) {
    const [comments, setComments] = useState<ReviewComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [showInput, setShowInput] = useState(defaultExpanded);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch comments for this review
    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/review-comments?review_id=${reviewId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [reviewId]);

    // Focus the input when it appears
    useEffect(() => {
        if (showInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showInput]);

    // Submit a new comment (optimistic — shows up immediately)
    const handleSubmit = async () => {
        if (!userId) {
            alert('You must be logged in to comment.');
            return;
        }
        if (!commentText.trim()) return;

        const content = commentText.trim();

        // Optimistically add the comment to the UI right away
        const optimisticComment: ReviewComment = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            edited_at: null,
            content,
            is_flagged: false,
            user_id: userId,
            review_id: reviewId,
            users: null, // will be filled on sync
        };

        setComments((prev) => [optimisticComment, ...prev]);
        setCommentText('');
        setSubmitting(false);
        // Auto-expand replies so the user sees their comment
        setExpanded(true);

        // Fire the actual API call in the background
        try {
            const res = await fetch('/api/review-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_id: reviewId,
                    user_id: userId,
                    content,
                }),
            });

            if (!res.ok) {
                setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
                const err = await res.json();
                alert(err.error || 'Failed to post comment');
                return;
            }

            // Sync with the server to get real data (including user info)
            fetchComments();
        } catch (err: any) {
            console.error('Submit comment error:', err);
            setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
        }
    };

    // Submit an edit (optimistic — text updates immediately)
    const handleEditSubmit = async (commentId: number) => {
        if (!userId || !editText.trim()) return;

        const newContent = editText.trim();
        const now = new Date().toISOString();

        setComments((prev) =>
            prev.map((c) =>
                c.id === commentId ? { ...c, content: newContent, edited_at: now } : c
            )
        );
        setEditingId(null);
        setEditText('');

        try {
            const res = await fetch('/api/review-comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: commentId,
                    user_id: userId,
                    content: newContent,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to edit comment');
                fetchComments();
                return;
            }

            fetchComments();
        } catch (err: any) {
            console.error('Edit comment error:', err);
            fetchComments();
        }
    };

    const startEditing = (comment: ReviewComment) => {
        setEditingId(comment.id);
        setEditText(comment.content);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditText('');
    };

    const commentCount = loading ? null : comments.length;
    const hasComments = commentCount !== null && commentCount > 0;

    // Helper to get display name for a comment
    const getDisplayName = (c: ReviewComment) => {
        if (c.users?.name) return c.users.name;
        if (c.users?.username) return c.users.username;
        return 'User';
    };

    return (
        <div className="mt-4 pt-3 border-t border-white/5 relative">

            {/* Action bar — always visible */}
            <div className="flex items-center w-full bg-black/20 rounded-xl p-1 border border-white/5 backdrop-blur-md shadow-inner">
                {/* Column 1: Upvote button */}
                <div className="flex-1 flex justify-center relative cursor-pointer">
                    <div className="w-full flex justify-center py-1.5 rounded-lg hover:bg-[#1DB954]/10 transition-colors duration-300">
                        <UpvoteButton postId={reviewId} userId={userId} />
                    </div>
                    {/* Subtle separator */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-white/10"></div>
                </div>

                {/* Column 2: Add comment button */}
                <div className="flex-1 flex justify-center relative cursor-pointer">
                    <button
                        onClick={() => {
                            if (!userId) {
                                alert('You must be logged in to comment.');
                                return;
                            }
                            setShowInput(!showInput);
                            if (!showInput) setExpanded(true);
                        }}
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${showInput ? 'text-[#1DB954] bg-[#1DB954]/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {showInput ? (
                            <X className="w-4 h-4" />
                        ) : (
                            <MessageCircle className="w-4 h-4" />
                        )}
                        {showInput ? 'CANCEL' : 'COMMENT'}
                    </button>
                    {/* Subtle separator */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-white/10"></div>
                </div>

                {/* Column 3: Expand/collapse replies toggle */}
                <div className="flex-1 flex justify-center">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${hasComments ? 'text-gray-400 hover:text-[#1DB954] hover:bg-[#1DB954]/10' : 'text-gray-700 cursor-not-allowed'}`}
                        disabled={!hasComments}
                    >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180 text-[#1DB954]' : ''}`} />
                        {commentCount !== null ? commentCount : 0} {commentCount === 1 ? 'REPLY' : 'REPLIES'}
                    </button>
                </div>
            </div>

            {/* Comment input — shows when "Add comment" is clicked */}
            {showInput && userId && (
                <div className="flex gap-2 items-center mt-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !submitting) handleSubmit();
                            if (e.key === 'Escape') {
                                setShowInput(false);
                                setCommentText('');
                            }
                        }}
                        placeholder="Write a reply..."
                        className="flex-1 bg-[#0a0a0a] border border-gray-800 rounded-full px-4 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#1DB954] transition-colors"
                        id={`comment-input-${reviewId}`}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !commentText.trim()}
                        className="w-8 h-8 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                    >
                        {submitting ? (
                            <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5 text-black" />
                        )}
                    </button>
                </div>
            )}

            {/* Expanded replies list */}
            {expanded && (
                <div className="mt-3 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-3">
                            <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                        </div>
                    ) : comments.length > 0 ? (
                        comments.map((c) => (
                            <div key={c.id} className="flex gap-2.5 group">
                                {/* User avatar */}
                                {c.users?.profile_picture_url ? (
                                    <ImageWithFallback
                                        src={c.users.profile_picture_url}
                                        alt={getDisplayName(c)}
                                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-gray-700"
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-white font-bold text-[10px]">
                                            {getDisplayName(c).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    {editingId === c.id ? (
                                        // Editing mode
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleEditSubmit(c.id);
                                                    if (e.key === 'Escape') cancelEditing();
                                                }}
                                                className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition-colors"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleEditSubmit(c.id)}
                                                disabled={!editText.trim()}
                                                className="text-[#1DB954] hover:text-[#1ed760] disabled:opacity-50 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="text-gray-500 hover:text-white transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        // Normal display mode
                                        <>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white text-xs font-medium">
                                                    {getDisplayName(c)}
                                                </span>
                                                {c.users?.username && (
                                                    <span className="text-gray-600 text-[10px]">
                                                        @{c.users.username}
                                                    </span>
                                                )}
                                                <span className="text-gray-700 text-[10px]">·</span>
                                                <span className="text-gray-600 text-[10px]">
                                                    {getTimeAgo(c.edited_at || c.created_at)}
                                                </span>
                                                {c.edited_at && (
                                                    <span className="text-gray-700 text-[10px] italic">edited</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-gray-300 text-xs leading-relaxed">
                                                    {c.content}
                                                </p>
                                                {userId && c.user_id === userId && (
                                                    <button
                                                        onClick={() => startEditing(c)}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-400 transition-all shrink-0"
                                                        title="Edit comment"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : null}
                </div>
            )}
        </div>
    );
}
