'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Disc3, ListVideo, LogOut, Music, Music2, SquarePen } from 'lucide-react';
import ProfilePicture from '@/components/img/ProfilePicture';
import { createClient } from '@/lib/supabase/browser';

type SidebarProps = {
    sidebarOpen: boolean
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    username: string,
    profilePictureUrl?: string,
}

export default function SideBar({
    sidebarOpen,
    setSidebarOpen,
    username,
    profilePictureUrl
}: SidebarProps) {

    const router = useRouter();
    const supabase = createClient();
    const [logoutError, setLogoutError] = useState(false);

    const push = (route: string) => {
        setSidebarOpen(false);
        router.push(route);
    }

    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            setLogoutError(true);
            return;
        }

        setLogoutError(false);
        setSidebarOpen(false);
        router.push('/');
    }
    const options = (
        <div className='flex flex-col w-full gap-3'>

            <div
                className="flex border-b border-gray-700 w-full gap-8 text-lg items-center pt-5 pb-4 hover:text-[#1DB954] transition-colors cursor-pointer"
                onClick={() => push(`/user/${username}`)}
            >

                <div className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-700 z-2">
                    <ProfilePicture
                        src={profilePictureUrl}
                        size={11}
                    />
                </div>
                <p>{username}</p>
            </div>

            <div
                className="flex border-b border-gray-700 w-full gap-8 text-lg items-center pt-3 pb-4 hover:text-[#1DB954] transition-colors cursor-pointer"
                onClick={() => push(`/user/${username}/edit`)}
            >
                <SquarePen className="w-11 h-11" />
                <p>Edit Profile</p>
            </div>

            <div
                className="flex border-b border-gray-700 w-full gap-8 text-lg items-center pt-3 pb-4 hover:text-[#1DB954] transition-colors cursor-pointer"
                onClick={() => push(`/user/${username}/services`)}
            >

                <Music className="w-11 h-11" />
                <p>Connected accounts</p>
            </div>

            <div
                className="flex border-b border-gray-700 w-full gap-8 text-lg items-center pt-3 pb-4 hover:text-[#1DB954] transition-colors cursor-pointer"
                onClick={() => push(`/user/${username}/lists`)}
            >
                <ListVideo className="w-11 h-11" />
                <p>Lists</p>
            </div>

            <div
                className="flex border-b border-gray-700 w-full gap-8 text-lg items-center pt-3 pb-4 hover:text-[#1DB954] transition-colors cursor-pointer"
                onClick={() => push(`/user/${username}/reviews`)}
            >
                <Disc3 className="w-11 h-11" />
                <p>Reviews</p>
            </div>


        </div>
    )

    return (
        <>
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`
          fixed top-0 right-0 h-full w-sm bg-[#0a0a0a]
          transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
        `}
            >
                <div className="px-6 flex flex-col h-full w-full justify-between items-center">
                    {options}

                    <div className='w-full'>
                        <p
                            hidden={!logoutError}
                            className='text-[#cd3434] text-sm mb-2'>
                                There was an error when attempting to log out. Please try again.
                            </p>
                        <div
                            className="flex border-t border-gray-700 w-full gap-8 text-lg items-center pt-4 pb-5 hover:text-[#cd3434] transition-colors cursor-pointer"
                            onClick={logout}
                        >
                            <LogOut className="w-11 h-11" />
                            <p>Log out</p>
                        </div>
                    </div>

                </div>
            </aside>
        </>
    );


}