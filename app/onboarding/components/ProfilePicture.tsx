"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import fs from 'fs/promises';

type Props = {
    profilePictureUrl: string | null;
    setProfilePictureUrl: React.Dispatch<React.SetStateAction<string | null>>;
    setProfilePictureFile: React.Dispatch<React.SetStateAction<File | null>>;
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}
export default function ProfilePicture({
    profilePictureUrl,
    setProfilePictureUrl,
    setProfilePictureFile,
    arrowPress,
    setComponentState
}: Props) {

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleRemovePhoto = () => {
        setProfilePictureUrl(null);
        setProfilePictureFile(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setProfilePictureUrl(imageUrl);
        setProfilePictureFile(file);
    };

    useEffect(() => {
        if (arrowPress === 0) return; // skip inital load
        
        // no need for check here: will either be file or no file.
        setComponentState('success')
    }, [arrowPress])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-white mb-2">Profile photo</h2>
                <p className="text-gray-400 text-lg mb-8">Add a photo so people recognise you. (Optional)</p>

                <div className="flex flex-col items-center gap-6">
                    {profilePictureUrl ? (
                        <div className="relative">
                            <img
                                src={profilePictureUrl}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover"
                            />
                            <button
                                onClick={handleRemovePhoto}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors text-2xl leading-none"
                            >
                                x
                            </button>
                        </div>
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-[#282828] flex items-center justify-center">
                            <User className="w-16 h-16 text-gray-600" />
                        </div>
                    )}

                    <div className="flex flex-col gap-3 w-full">

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-[#282828] hover:bg-[#383838] text-white py-3 rounded-lg transition-colors"
                        >
                            Upload photo
                        </button>
                        <p className="text-gray-500 text-xs text-center">
                            JPG, PNG — up to 5MB. You can change this later.
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}