'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function BannedPage() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkBanStatus() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('banned')
                .eq('id', user.id)
                .single();

            if (profile && !profile.banned) {
                router.push('/feed');
            }
        }

        checkBanStatus();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black gap-3">
            <p className="text-white font-semibold text-lg">Account Suspended</p>
            <p className="text-gray-400 text-sm">Your account has been banned. Please contact support.</p>
        </div>
    );
}