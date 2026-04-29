'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface UpvoteButtonProps {
    postId: number;
    userId: string | null;
}

export default function UpvoteButton({ postId, userId }: UpvoteButtonProps) {
    const [count, setCount] = useState(0);
    const [upvoted, setUpvoted] = useState(false);
    const [busy, setBusy] = useState(false);

    // Fetch initial upvote state
    useEffect(() => {
        async function fetchUpvotes() {
            try {
                const params = new URLSearchParams({ post_id: String(postId) });
                if (userId) params.set('user_id', userId);

                const res = await fetch(`/api/upvotes?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count);
                    setUpvoted(data.user_upvoted);
                }
            } catch (err) {
                console.error('Failed to fetch upvotes:', err);
            }
        }
        fetchUpvotes();
    }, [postId, userId]);

    const handleToggle = async () => {
        if (!userId) {
            alert('You must be logged in to upvote.');
            return;
        }
        if (busy) return;

        // Optimistic update
        const wasUpvoted = upvoted;
        setUpvoted(!wasUpvoted);
        setCount((prev) => prev + (wasUpvoted ? -1 : 1));
        setBusy(true);

        try {
            const res = await fetch('/api/upvotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, user_id: userId }),
            });

            if (!res.ok) {
                // Revert on failure
                setUpvoted(wasUpvoted);
                setCount((prev) => prev + (wasUpvoted ? 1 : -1));
            }
        } catch {
            // Revert on error
            setUpvoted(wasUpvoted);
            setCount((prev) => prev + (wasUpvoted ? 1 : -1));
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                handleToggle();
            }}
            className={`w-full h-full flex items-center justify-center gap-1.5 transition-all duration-300 text-xs font-semibold tracking-wide uppercase ${
                upvoted
                    ? 'text-[#1DB954]'
                    : 'text-gray-400 hover:text-[#1DB954]'
            }`}
            title={upvoted ? 'Remove upvote' : 'Upvote'}
        >
            <Heart
                className={`w-4.5 h-4.5`}
            />
            {count > 0 && <span>{count}</span>}
        </button>
    );
}
