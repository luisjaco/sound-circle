"use server"


import { getProfile, getProfileStatistics, getFavoriteGenres } from '../queries';
import { createClient } from '@/lib/supabase/server';

import Header from './Header';

type Props = {
    username: string,
}

export default async function ProfileHeader({
    username,
}: Props) {

    const supabase = await createClient();
    const profile = await getProfile(supabase, username);

    const id = profile.id;

    const relevantProfile = {
        id: id,
        username: username,
        profilePicture: profile.profile_picture_url || '',
        city: profile.city,
        state: profile.state,
        bio: profile.bio,
        name: profile.name
    }


    const [stats, genres] = await Promise.all([
        getProfileStatistics(supabase, profile.id),
        getFavoriteGenres(supabase, id)
    ]);

    const relevantStats = {
        reviews: stats.reviews || 0,
        followers: stats.followers || 0,
        following: stats.following || 0
    }

    const currentUser = await supabase.auth.getUser();

    const completeGenres = populateGenres(genres);

    return <Header
        profile={relevantProfile}
        stats={relevantStats}
        currentUser={currentUser}
        genres={completeGenres}
    />
}

// deterministic hash to give the genres pop.
function stringToColor(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }

    const h = hash % 360           // hue (0-360)
    const s = 50                    // lower saturation = more muted
    const l = 40                    // higher lightness = softer/faded

    return `hsl(${h}, ${s}%, ${l}%)`
}

function populateGenres(genres: any) {

    // we need top three genres, if user has less than three we will use blank placeholders.
    let i = 0
    const genreComponents = [];

    for (const g of genres || []) {

        const color = stringToColor(g.genres.genre);

        genreComponents.push(
            <div
                key={g.genre_id}
                style={{ backgroundColor: color }}
                className="flex items-center justify-center p-2 rounded-lg w-40 min-h-15 max-h-20 overflow-hidden"
            >
                <span className="text-white font-bold italic">{g.genres.genre}</span>
            </div>
        )
        i++;
    }

    // cleanup
    while (i < 3) {
        genreComponents.push(
            <div
                key={`genreStandIn#${i}`}
                className="flex items-center justify-center bg-[#000000] p-2 rounded-lg w-40 min-h-10"
            >
                <span className="text-white"></span>
            </div>
        );
        i++;
    }

    return genreComponents;
}
