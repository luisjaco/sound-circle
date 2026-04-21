'use client'

import ProfilePicture from "@/components/img/ProfilePicture";
import { useContext, useState } from 'react';
import { Home, Menu, Search, X } from "lucide-react";
import { useRouter, usePathname, notFound } from "next/navigation";
import { AsideContext } from "../../../components/AsideContext";

import Logo from "@/components/Logo";

type HeaderProps = {
    username: string,
    profilePictureUrl?: string,
}

export default function Header({
    username,
    profilePictureUrl
}: HeaderProps) {

    const context = useContext(AsideContext);
    if (!context) notFound();
    const { setSidebarOpen } = context;

    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState('');

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

    // hacky way to lock the scroll when the sidebar is active... refer to SideBar.tsx for unlock.
    function lockScroll() {
        const scrollY = window.scrollY;

        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.overflow = "hidden";
    }

    const openSideBar = () => {
        // so there is no scroll within background.
        lockScroll()
        setSidebarOpen(true)
    }

    return (
        <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10 flex justify-between items-center py-1">

            <div
                className="cursor-pointer"
                onClick={() => router.push('/feed')}
            >
                {soundCircleLogo}
            </div>


            {
                (pathname !== '/search') && (
                    <form
                        className="flex items-center bg-[#181818] border border-gray-800 rounded-2xl px-4 py-3 focus-within:border-[#1DB954] transition-colors w-3xl h-full"
                        onSubmit={(e) => {
                            e.preventDefault()

                            if (!query.trim()) return;

                            router.push(`/search?query=${encodeURIComponent(query)}`)
                            setQuery('');
                        }}
                    >
                        <Search
                            className="w-8 h-8 text-gray-500 mr-3 shrink-0 hover:text-[#1DB954] transition-colors cursor-pointer"
                            onClick={() => router.push('/search')}
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search users, artists, albums, songs..."
                            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base"
                            id="search-input"
                        />
                        {query && (
                            <button
                                type='button'
                                onClick={() => setQuery('')}
                                className="text-gray-500 hover:text-white transition-colors ml-2"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </form>
                )
            }


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
                    onClick={openSideBar}
                    className="flex justify-center items-center gap-1 text-gray-400 hover:text-[#1DB954] transition-colors cursor-pointer"
                >
                    <Menu className="w-11 h-11" />
                </button>
            </div>

        </header>
    );
}