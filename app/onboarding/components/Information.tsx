'use client'
import { useState, useEffect } from 'react';

type Props = {
    fullName: string;
    setFullName: React.Dispatch<React.SetStateAction<string>>;
    city: string;
    setCity: React.Dispatch<React.SetStateAction<string>>;
    state: string;
    setState: React.Dispatch<React.SetStateAction<string>>;
    bio: string;
    setBio: React.Dispatch<React.SetStateAction<string>>;
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}

export default function Informtion({
    fullName,
    setFullName,
    city,
    setCity,
    state,
    setState,
    bio,
    setBio,
    arrowPress,
    setComponentState
}: Props) {

    const [fullNameError, setFullNameError] = useState('');

    const validateFullName = () => {
        if (!fullName || fullName.trim() === '') {
            setFullNameError('Full name is required');
            return false;
        } else {
            setFullNameError('');
            return true;
        }
    };

    useEffect(() => {
        if (arrowPress === 0) return; // skip inital load

        validateFullName() ? setComponentState('success') : setComponentState('failure');

    }, [arrowPress]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-white mb-2">Tell us about yourself</h2>
                <p className="text-gray-400 text-lg mb-8">Help others get to know you.</p>

                <div className="space-y-4">
                    <div>
                        <label className="text-white font-medium block mb-3">Full name*</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => {
                                setFullName(e.target.value);
                                if (fullNameError) setFullNameError('');
                            }}
                            onBlur={() => validateFullName()}
                            placeholder="Your Name"
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                        />
                        {fullNameError && (
                            <p className="text-red-500 text-sm mt-2">{fullNameError}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-white font-medium block mb-3">State</label>
                        <input
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="NY"
                            maxLength={2}
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-white font-medium block mb-3">City</label>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Old Westbury"
                            maxLength={50}
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-white font-medium block mb-3">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Always discovering new sounds!"
                            rows={3}
                            maxLength={150}
                            className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors resize-none"
                        />
                        <p className="text-gray-500 text-xs mt-2">{bio.length}/150 characters</p>
                    </div>
                </div>
            </div>
        </div>
    )
}