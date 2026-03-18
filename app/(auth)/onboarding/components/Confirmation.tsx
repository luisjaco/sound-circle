'use client';
import { createClient } from '@/lib/supabase/browser';
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { createUser } from '../queries';

type Genre = {
    id: number,
    genre: string
}

type Artist = {
    id: string,
    name: string
}

type Props = {
    profilePictureUrl: string;
    profilePictureFile: File;
    fullName: string;
    bio: string;
    username: string;
    city: string;
    state: string;
    favoriteGenres: Genre[];
    favoriteArtists: Artist[];
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}

export default function Confirmation({
    profilePictureUrl,
    profilePictureFile,
    fullName,
    bio,
    username,
    city,
    state,
    favoriteGenres,
    favoriteArtists,
    arrowPress,
    setComponentState,
}: Props
) {

    const supabase = createClient();
    const [submissionError, setSubmissionError] = useState(false);

    useEffect(() => {
        if (arrowPress === 0) return; // skip inital load

        let isMounted = true;

        const submit = async () => {
            setComponentState('working');
            const userCreated = await createUser(
                supabase,
                profilePictureUrl as string,
                profilePictureFile as File,
                fullName,
                bio,
                username,
                city,
                state,
                favoriteGenres,
                favoriteArtists
            );

            if (!userCreated) {
                setSubmissionError(true);
                setComponentState('failure');
            } else {
                setSubmissionError(false);
                setComponentState('success');
            }
        }

        submit();

        return () => {
            isMounted = false;
        }
    }, [arrowPress])


    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-white mb-2">Confirm your information</h2>
                <p className="text-gray-400 text-lg mb-3">Final check before becoming a SoundCircle user!</p>

                {submissionError && (
                    <p className="text-red-500 text-sm mt-2">There was an error creating your profile.</p>
                )}

                <div className="flex flex-col items-center gap-6 mb-3">
                    {profilePictureUrl ? (
                        <div className="relative">
                            <img
                                src={profilePictureUrl}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-[#282828] flex items-center justify-center">
                            <User className="w-16 h-16 text-gray-600" />
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <div className="mb-3">
                        <label className="text-white font-medium block mb-3">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">@</span>
                            <input
                                type="text"
                                value={username}
                                disabled={true}
                                className="w-full bg-[#282828] text-white pl-10 pr-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-white font-medium block mb-3">Full name</label>
                        <input
                            type="text"
                            value={fullName}
                            disabled={true}
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-white font-medium block mb-3">State</label>
                        <input
                            value={state}
                            disabled={true}
                            maxLength={2}
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-white font-medium block mb-3">City</label>
                        <input
                            value={city}
                            disabled={true}
                            maxLength={50}
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-white font-medium block mb-3">Bio</label>
                        <textarea
                            value={bio}
                            disabled={true}
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-white font-medium block mb-3">Favorite Genres</label>
                        <div className="inline-flex">
                            {
                                favoriteGenres.map((genre) => (
                                    <div
                                        key={genre.id}
                                        className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mx-1.5"
                                    >
                                        <span className="text-white">{genre.genre}</span>
                                    </div>
                                ))}
                        </div>

                    </div>
                    <div>
                        <label className="text-white font-medium block mb-3">Favorite Artists</label>
                        <div className='inline-flex'>
                            {
                                favoriteArtists.map((artist) => (
                                    <div
                                        key={artist.id}
                                        className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mb-3 mx-1.5"
                                    >
                                        <span className="text-white">{artist.name}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}