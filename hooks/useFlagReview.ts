import { useState } from 'react';

export function useFlagReview(reviewId: number, reviewType: 'song' | 'album') {
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleFlagClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSubmitSuccess(false);
        setSubmitError('');
        setShowFlagModal(true);
    };

    const handleFlagSubmit = async (reason: string) => {
        if (!reviewId) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const type = reviewType === 'song' ? 'song_review' : 'album_review';
            const res = await fetch('/api/moderation/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, reviewId, reason }),
            });
            const data = await res.json();
            if (!res.ok) setSubmitError(data.error || 'Failed to submit report.');
            else setSubmitSuccess(true);
        } catch {
            setSubmitError('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    return {
        showFlagModal,
        setShowFlagModal,
        submitting,
        submitError,
        submitSuccess,
        handleFlagClick,
        handleFlagSubmit,
    };
}