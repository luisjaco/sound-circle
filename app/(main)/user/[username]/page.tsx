"use server"

import { createClient } from '@/lib/supabase/server';
import ProfileHeader from './components/ProfileHeader'
import Favorites from './components/Favorites';
import ProfileFooter from './components/ProfileFooter';
import { getProfile, getProfileStatistics } from './queries';
import { Suspense } from 'react';

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const supabase = await createClient();
    const { username } = await params;

    const { userId, profileInfo } = await getProfile(supabase, username);

    const [reviewCount, followers, following] = await getProfileStatistics(supabase, userId);

    return (
        <div className="min-h-screen bg-black pb-20">
            <div className="max-w-4xl mx-auto px-4">
                <ProfileHeader
                    userId={userId}
                    username={profileInfo.username}
                    isOwner={profileInfo.isOwner}
                    name={profileInfo.name}
                    city={profileInfo.city}
                    state={profileInfo.state}
                    bio={profileInfo.bio}
                    profileUrl={profileInfo.profile_picture_url}
                    reviews={reviewCount || 0}
                    followers={followers || 0}
                    following={following || 0}
                />
                <Suspense fallback={<div className="flex py-6 border-b border-gray-800 h-90 w-full"></div>}>
                    <Favorites
                        userId={userId}
                    />
                </Suspense>
                <ProfileFooter />
            </div>
        </div>
    )
}