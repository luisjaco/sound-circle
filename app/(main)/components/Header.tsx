'use client'

import ProfilePicture from "@/components/img/ProfilePicture";

import { Home, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import Logo from "@/components/Logo";

type HeaderProps = {
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>,
    username: string,
    profilePictureUrl?: string,
}

export default function Header({
    setSidebarOpen,
    username,
    profilePictureUrl
}: HeaderProps) {

    const router = useRouter();


    const soundCircleLogo = (
        <div className="max-w-2xl  px-4 py-4 inline-flex items-center">
            <h1 className="text-4xl font-bold text-white mr-1">
                Sound<span className="text-[#1DB954]">Circle</span>
            </h1>
            <Logo
                className="animate-spin [animation-duration:16s]"
                size={40}
            />
        </div>

    )

    return (
        <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10 flex justify-between items-center py-1">

            {soundCircleLogo}

            <div className="flex items-center bg-[#181818] border border-gray-800 rounded-2xl px-4 py-3 focus-within:border-[#1DB954] transition-colors w-200 h-full">
                <Search className="w-8 h-8 text-gray-500 mr-3 shrink-0" />
                <input
                    type="text"
                    placeholder="Search users, artists, albums, songs..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
                    id="search-input"
                />
            </div>

            <div className='flex gap-12 mx-5'>
                <button
                    className="flex justify-center items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors cursor-pointer"
                    onClick={() => router.push('/feed')}
                >
                    <Home className="w-11 h-11" />
                </button>
                <button
                    onClick={() => router.push(`/user/${username}`)}
                    className="flex justify-center items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors cursor-pointer"
                >
                    <div className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all z-2">
                        <ProfilePicture
                            src={profilePictureUrl}
                            size={11}
                        />
                    </div>
                </button>

                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex justify-center items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors cursor-pointer"
                >
                    <Menu className="w-11 h-11" />
                </button>
            </div>

        </header>
    );
}