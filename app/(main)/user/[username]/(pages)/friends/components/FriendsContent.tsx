'use client'
import { notFound, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import FriendCard from './FriendCard';
import { createClient } from '@/lib/supabase/browser';

type Friend = {
    id: string,
    username: string,
    name: string,
    city?: string,
    state?: string,
    profile_picture_url?: string,
    follower: boolean,
    following: boolean,
    currentUserFollowing: boolean
}

type FriendsContentProps = {
    friends: Friend[]
    pageUserId: string,
    viewingUserId: string,
}

export default function FriendsContent({
    friends,
    pageUserId,
    viewingUserId
}: FriendsContentProps) {

    const [friendList, setFriendList] = useState<Friend[]>(friends);
    const [mode, setMode] = useState<'FOLLOWERS' | 'FOLLOWING'>('FOLLOWERS');
    const searchParams = useSearchParams(); // set mode for content to start in
    const m = searchParams?.get('m'); // as 'followers' or 'following', or null
    if (m && m === 'following') setMode('FOLLOWING'); // default to following so no check needed.

    const tabs = (
        <div className="flex w-2xl h-20 gap-1 bg-[#111] justify-around rounded-lg p-1 border border-gray-800/50">
            <button
                onClick={() => setMode('FOLLOWERS')}
                className={`flex items-center gap-1.5 py-1.5 px-8 rounded-md text-lg font-medium transition-all duration-200 cursor-pointer ${mode === 'FOLLOWERS'
                    ? 'bg-[#1DB954] text-black '
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                Followers
            </button>
            <button
                onClick={() => setMode('FOLLOWING')}
                className={`flex items-center gap-1.5 py-1.5 px-8 rounded-md text-lg font-medium transition-all duration-200 cursor-pointer ${mode === 'FOLLOWING'
                    ? 'bg-[#1DB954] text-black '
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                Following
            </button>
        </div>
    )

    return (
        <div className='w-4xl px-4 bg-black pb-20 flex flex-col gap-4 items-center'>
            {tabs}

            <div className='w-full border-b border-gray-800 mb-5' />


            <div className='flex flex-col gap-5'>
                {friendList.map((user: any, k: number) => {
                    return (<FriendCard key={'f_' + k} user={user} mode={mode} pageUserId={pageUserId} viewingUserId={viewingUserId} setFriendList={setFriendList}/>)
                })}
            </div>

        </div>
    )
}

/** @todo you need to redo the way this works, it needs to be some type of function that holds all 
 * users in one list, and when you follow/unfollow someone that must be displayed across both pages.
 * 
 */