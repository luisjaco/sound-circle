"use client"

import { Music } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import ProfilePicture from '@/components/img/ProfilePicture';

export default function ProfileHeader(props: {
    userId: string,
    username: string,
    isOwner: boolean,
    name: string,
    city: string,
    state: string,
    bio: string,
    profileUrl: string,
    reviews: number,
    followers: number,
    following: number
}) {
    const router = useRouter();

    /** @todo follower count, other.... */
    return (
        <div className="py-6 border-b border-gray-800">
            <div className="flex items-start gap-6 mb-6">
                <ProfilePicture 
                    src={props.profileUrl}
                    size={24}
                />
                
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {props.username}
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                        {props.bio}
                    </p>

                    {/* Connected Services */}
                    <div className="flex gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-full">
                            <svg
                                className="w-4 h-4 text-[#1DB954]"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3" />
                            </svg>
                            <span className="text-xs text-gray-300">Spotify</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-full">
                            <Music className="w-4 h-4 text-[#FA2D48]" />
                            <span className="text-xs text-gray-300">Apple Music</span>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-white font-bold text-lg">{props.reviews}</p>
                            <p className="text-gray-400 text-sm">Reviews</p>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold text-lg">{props.followers}</p>
                            <p className="text-gray-400 text-sm">Followers</p>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold text-lg">{props.following}</p>
                            <p className="text-gray-400 text-sm">Following</p>
                        </div>
                    </div>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full border-gray-700 bg-transparent hover:bg-[#181818] text-white rounded-full"
                onClick={() => router.push("/edit-profile")}
            >
                Edit Profile
            </Button>
        </div>
    )
}