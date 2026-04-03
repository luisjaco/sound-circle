"use server"

import { createClient } from '@/lib/supabase/server';
import ProfileHeader from './components/ProfileHeader'
import Favorites from './components/Favorites';
import ProfileFooter from './components/ProfileFooter';
import { getClient } from './queries';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const supabase = await createClient();
    const { username } = await params;

    const userId = await getClient(supabase);

    return (
        <div className="min-h-screen bg-black pb-20">
            <div className="max-w-4xl mx-auto px-4">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center border-b border-gray-800 h-100 w-full">
                            <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
                        </div>
                    }>
                    <ProfileHeader
                        username={username}
                    />
                </Suspense>

                <Suspense
                    fallback={
                        <div className="flex items-center justify-center border-b border-gray-800 h-90 w-full">
                            <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
                        </div>
                    }>
                    <Favorites
                        userId={userId}
                    />
                </Suspense>
                <ProfileFooter username={username} />
            </div>
        </div>
    )
}