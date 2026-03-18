import { createClient } from '@/lib/supabase/server';
import ProfileHeader from './components/ProfileHeader'
import Header from './components/Header';
import ProfileBody from './components/ProfileBody';
import ProfileFooter from './components/ProfileFooter';
import { getProfile, getProfileStatistics } from './queries'; 

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const supabase = await createClient();
    const { username } = await params;

    const { userId, profileInfo } = await getProfile(supabase, username);
    const [ reviewCount, followers, following ] = await getProfileStatistics(supabase, userId);

    return (
        <div className="min-h-screen bg-black pb-20">
            <Header />
            <div className="max-w-2xl mx-auto px-4">
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
                <ProfileBody />
                <ProfileFooter />
            </div>
        </div>

    )
}