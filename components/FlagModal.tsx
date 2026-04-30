'use client'
import { useState } from 'react';

export const FLAG_REASONS = [
    'Spam',
    'Harassment',
    'Hate Speech',
    'Inappropriate Content',
    'Other',
]

export function FlagModal({
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={onClose}
        >
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