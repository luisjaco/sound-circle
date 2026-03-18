'use client'

import ProfilePicture from "@/components/img/ProfilePicture";
import { createClient } from "@/lib/supabase/browser";
import { Home, Search, PlusCircle, User } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavigationFooter() {

    const router = useRouter();
    const supabase = createClient();
    const [username, setUsername] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');

    useEffect(() => {
        let isMounted = true;

        const grabCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            // error should not be possible given user is created, but if it is we will push notFound();
            if (!user) notFound();

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (!profile) notFound();

            setUsername(profile.username);
            setProfilePictureUrl(profile.profile_picture_url);
        }

        grabCurrentUser();

        return () => {
            isMounted = false;
        }
    }, []);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-800 z-20">
            <div className="max-w-2xl mx-auto px-4 py-3 flex justify-around items-center">
                <button
                    className="flex flex-col items-center gap-1 text-[#1DB954]"
                    onClick={() => router.push('/feed')}
                >
                    <Home className="w-6 h-6" />
                    <span className="text-xs">Home</span>
                </button>
                <button
                    onClick={() => router.push('/search')}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                    <Search className="w-6 h-6" />
                    <span className="text-xs">Search</span>
                </button>
                <button
                    onClick={() => router.push("/review")}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors"
                >
                    <PlusCircle className="w-8 h-8" />
                    <span className="text-xs">Review</span>
                </button>
                <button
                    onClick={() => router.push(`/user/${username}`)}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                    <ProfilePicture 
                        src={profilePictureUrl}
                        size={8}
                    />
                    <span className="text-xs">Me</span>
                </button>
            </div>
        </nav>
    );
}