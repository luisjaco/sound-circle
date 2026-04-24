'use client'

import ProfilePicture from "@/components/img/ProfilePicture"
import { SetStateAction, useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/browser"

type FriendCardProps = {
    pageUserId: string,
    viewingUserId: string,
    user: Friend,
    mode: 'FOLLOWERS' | 'FOLLOWING'
    setFriendList: React.Dispatch<SetStateAction<Friend[]>>
}

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

export default function FriendCard({ pageUserId, viewingUserId, user, mode, setFriendList }: FriendCardProps) {

    const router = useRouter();


    const [followError, setFollowError] = useState(false);

    const handleFollow = async () => {
        const action = user.currentUserFollowing ? 'unfollow' : 'follow';

        const res = await fetch('/api/supabase/friends', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({
                userId: viewingUserId,
                followId: user.id,
                action: action
            })
        })

        if (!res.ok || !(res.status === 200)) {
            setFollowError(true);
            return;
        }

        
        setFollowError(false);
        // setFollowing((e: boolean) => !e);
        // if page user diff than current user... just change current user status. else, change both
        // user and following status.
        setFriendList((prev) => {
            return prev.map( (u) => {
                return u.id === user.id ? {
                    ...user,
                    currentUserFollowing: !user.currentUserFollowing, 
                    following: (pageUserId === viewingUserId ? !user.following : user.following),
                } : u;
            })
        })
    }

    const profileSection = (
        <div className="flex flex-full w-lg h-30 py-4 items-center gap-5">
            <div
                onClick={() => router.push(`/user/${user.username}`)}
                className='flex items-center justify-center w-24 h-24 rounded-full object-cover ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all cursor-pointer'>
                <ProfilePicture src={user.profile_picture_url} size={24} />
            </div>

            <div className='flex flex-col w-auto h-full'>
                <h2
                    onClick={() => router.push(`/user/${user.username}`)}
                    className="text-3xl font-bold text-white hover:text-[#1DB954] cursor-pointer hover:underline">
                    {user.username}
                </h2>
                <p className="text-gray-400 font-bold">{user.name}</p>
                <p className="text-gray-400 italic text-sm">
                    {`${(user.city || user.state) && '  \n  '
                        }${user.city ? user.city : ''
                        }${((user.city && user.state) ? ', ' : "")
                        }${user.state ? user.state : ""
                        }`}
                </p>
            </div>
        </div>
    )

    const followButton = (<div className='flex flex-col w-40 h-10 items-center'>
        {(viewingUserId !== user.id) &&
            (
                <>
                    <div className={`flex justify-center items-center w-40 h-10 bg-[#1DB954]
        rounded-md cursor-pointer transition-colors font-semibold
            ${user.currentUserFollowing ?
                            (
                                (mode === 'FOLLOWING' && viewingUserId === pageUserId)
                                    ? 'bg-transparent ring-2 ring-red-500 text-red-500 hover:bg-red-900'
                                    : 'bg-transparent ring-2 ring-[#1DB954] text-[#1DB954] hover:bg-red-900')
                            : 'bg-transparent ring-2 ring-white text-white hover:bg-[#1DB954]'
                        }`}
                        onClick={handleFollow}
                    >
                        {user.currentUserFollowing ?
                            (
                                (mode === 'FOLLOWING' && viewingUserId === pageUserId)
                                    ? 'Unfollow' : 'Following')
                            : 'Follow'}
                    </div>
                    <p className="text-xs text-red-500 mt-2" hidden={!followError} >An error occured</p>
                </>
            )}

    </ div>)

    return (<div hidden={!((mode === 'FOLLOWERS' && user.follower) || (mode === 'FOLLOWING' && user.following))} className='flex w-3xl h-35 bg-[#070707] hover:bg-[#181818] items-center justify-between px-10 rounded-lg transition-colors'>
        {profileSection}
        {followButton}
    </ div>)
}
