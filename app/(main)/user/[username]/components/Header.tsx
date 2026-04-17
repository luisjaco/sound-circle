'use client'

import { Music, } from 'lucide-react';
import ProfilePicture from '@/components/img/ProfilePicture';
import { UserRoundCheck, UserRoundPlus } from "lucide-react";
import { createClient } from '@/lib/supabase/browser';
import { useState, useEffect } from 'react';
import AppleMusicIcon from '@/components/AppleMusicIcon';
import SpotifyIcon from '@/components/SpotifyIcon';

type HeaderProps = {
    profile: {
        id: string,
        username: string,
        name: string,
        profilePicture: string,
        city: string,
        state: string,
        bio: string,
    },
    stats: {
        reviews: number,
        followers: number,
        following: number
    },
    currentUser: any,
    genres: Object[]
}


export default function Header({
    profile,
    stats,
    currentUser,
    genres
}: HeaderProps
) {

    const supabase = createClient();
    const [isFollowing, setIsFollowing] = useState(false);
    const { id, username, profilePicture, city, state, bio, name } = profile;
    const { reviews, followers, following } = stats;
    const isUser = (currentUser.data.user?.id === id);
    const [followError, setFollowError] = useState(false);
    const [activeFollowers, setActiveFollowers] = useState(followers);

    useEffect(() => {
        let isMounted = true;


        const getIsFollowing = async () => {
            const { data, error } = await supabase
                .from('friends')
                .select('*')
                .match({
                    user_id: currentUser.data.user.id,
                    following: id
                });

            if (error) {
                console.error(`error when retrieving following status.`);
                console.error(error)
            }

            const f = ((data) && (data.length > 0)) || false;
            setIsFollowing(f);
        }

        getIsFollowing();

        return () => {
            isMounted = false;
        };
    }, [])

    const handleFollow = async () => {
        const action = isFollowing ? 'unfollow' : 'follow';

        const res = await fetch('/api/supabase/friends', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.data.user.id,
                followId: id,
                action: action
            })
        })

        if (!res.ok || !(res.status === 200)) {
            setFollowError(true);
        }

        setFollowError(false);
        setIsFollowing((e) => !e);
        setActiveFollowers((e) => action === 'follow' ? e + 1 : e - 1);
    }

    const profileHeader = (
        <div className="flex items-start gap-6 mb-6 overflow-hidden">
            <div className='flex flex-full flex-col relative'>
                <ProfilePicture
                    src={profilePicture}
                    size={48}
                />
                {
                    !isUser && (
                        <div
                            className='w-14 h-14 absolute bottom-0 right-0 bg-[#181818] rounded-full flex justify-center items-center cursor-pointer'
                            onClick={handleFollow}
                        >
                            {
                                isFollowing ?
                                    (<UserRoundCheck className='w-8 h-8 text-[#1DB954] hover:text-[#9fddb5] transition-all' />)
                                    :
                                    (<UserRoundPlus className='w-8 h-8 text-[#1DB954] hover:text-[#9fddb5] transition-all' />)
                            }
                        </div>
                    )
                }
            </div>

            <div className="flex-1">
                <h2 className="text-4xl font-bold text-white">
                    {username}
                </h2>
                <p className="text-gray-400 text-lg italic">
                    {`${name
                        } ${(city || state) && '  •  '
                        }${city ? city : ''
                        }${((city && state) ? ', ' : "")
                        }${state ? state : ""
                        }`}
                </p>
                <p className="text-gray-400 mt-3 text-md whitespace-pre font-mono">
                    {bio}
                </p>
            </div>
        </div>
    )

    const statistics = (
        <div className='flex justify-around mb-6'>

            <div className="text-center bg-[#181818] py-2 rounded-lg w-40">
                <p className="text-white font-bold text-2xl">{reviews}</p>
                <p className="text-gray-400 text-md">{reviews === 1 ? "Review" : "Reviews"}</p>
            </div>
            <div className={`text-center py-2 rounded-lg w-40  bg-[#181818] transition-all ${isFollowing && 'ring-1 ring-[#1DB954]'}`}>
                <p className="text-white font-bold text-2xl">{activeFollowers}</p>
                <p className="text-gray-400 text-md">{activeFollowers === 1 ? "Follower" : "Followers"}</p>
            </div>
            <div className="text-center bg-[#181818] py-2 rounded-lg w-40">
                <p className="text-white font-bold text-2xl">{following}</p>
                <p className="text-gray-400 text-md">Following</p>
            </div>
        </div>
    )




    return (
        <div className="pt-15 h-full">
            <p
                className='text-sm text-red-500 flex flex-full justify-center'
                hidden={!followError}
            >There was an error following this user.</p>
            <div className='flex w-full h-full'>

                <div className='flex w-4xl flex-col border-r border-gray-800'>

                    {profileHeader}
                    {statistics}
                </div>

                <div className='flex flex-col w-3xs justify-around items-center'>

                    <div className='flex justify-around w-full'>
                        <SpotifyIcon size={8} />
                        <AppleMusicIcon size={8} />
                    </div>
                    {
                        (true) ? (
                            genres.map((x: any, key: any) => {
                                return (
                                    <div key={key}>{x}</div>
                                )
                            })) : (
                            <div className='flex flex-col w-full justify-center items-center'>
                                <p className='text-gray-600'>No favorite genres yet</p>
                            </div>
                        )
                    }

                </div>
            </div>
        </div>
    )
}