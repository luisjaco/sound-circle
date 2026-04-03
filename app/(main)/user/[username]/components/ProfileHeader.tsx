"use server"

import { Music } from 'lucide-react';
import ProfilePicture from '@/components/img/ProfilePicture';
import { getProfile, getProfileStatistics, getFavoriteGenres } from '../queries';
import { createClient } from '@/lib/supabase/server';

type Props = {
    username: string,
}

export default async function ProfileHeader({
    username,
}: Props) {

    const supabase = await createClient();
    const profile = await getProfile(supabase, username);

    const id = profile.id;
    const profilePicture = profile.profile_picture_url || '';
    const city = profile.city;
    const state = profile.state;
    const bio = profile.bio;
    const name = profile.name;

    const [stats, genres] = await Promise.all([
        getProfileStatistics(supabase, profile.id),
        getFavoriteGenres(supabase, id)
    ]);

    const reviews = stats.reviews;
    const followers = stats.followers;
    const following = stats.following;

    const populateGenres = () => {
        // we need top three genres, if user has less than three we will use blank placeholders.
        let i = 0
        const genreComponents = [];

        for (const g of genres || []) {

            const color = stringToColor(g.genres.genre);

            genreComponents.push(
                <div
                    key={g.genre_id}
                    style={{backgroundColor: color}}
                    className="flex items-center justify-center p-3 rounded-lg mx-1.5 min-w-30 h-15"
                >
                    <span className="text-white">{g.genres.genre}</span>
                </div>
            )
            i++;
        }

        // cleanup
        while (i < 3) {
            genreComponents.push(
                <div
                    key={`genreStandIn#${i}`}
                    className="flex items-center justify-center bg-[#070707] p-3 rounded-lg mx-1.5 min-w-30 h-15"
                >
                    <span className="text-white"></span>
                </div>
            );
            i++;
        }

        return genreComponents;
    }

    const profileHeader = (
        <div className="flex items-start gap-6 mb-6 overflow-hidden">
            <ProfilePicture
                src={profilePicture}
                size={48}
            />

            <div className="flex-1">
                <div className='inline-flex w-md items-baseline'>
                    <h2 className="text-4xl font-bold text-white">
                        {username}
                    </h2>
                    <p className="text-gray-400 text-lg ml-2 italic">
                        {`${name
                            } ${(city || state) && '  •  '
                            }${city ? city : ''
                            }${((city && state) ? ', ' : "")
                            }${state ? state : ""
                            }`}
                    </p>
                </div>

                <p className="text-gray-400 mt-3 text-md whitespace-pre font-mono">
                    {bio}
                </p>
            </div>
        </div>
    )

    const statistics = (
        <div className='flex justify-between mb-6'>

            <div className="text-center bg-[#181818] py-2 px-10 rounded-lg">
                <p className="text-white font-bold text-2xl">{reviews}</p>
                <p className="text-gray-400 text-md">Reviews</p>
            </div>
            <div className="text-center bg-[#181818] py-2 px-10 rounded-lg">
                <p className="text-white font-bold text-2xl">{followers}</p>
                <p className="text-gray-400 text-md">Followers</p>
            </div>
            <div className="text-center bg-[#181818] py-2 px-10 rounded-lg">
                <p className="text-white font-bold text-2xl">{following}</p>
                <p className="text-gray-400 text-md">Following</p>
            </div>

            <div className="flex justify-around w-80">
                <div className="flex items-center gap-3 bg-[#181818] px-8 py-1.5 rounded-full">
                    <svg
                        className="w-8 h-8 text-[#1DB954]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3" />
                    </svg>
                </div>

                <div className="flex items-center gap-3 bg-[#181818] px-8 py-1.5 rounded-full">
                    <Music className="w-8 h-8 text-[#FA2D48]" />
                </div>
            </div>
        </div>
    )

    const favoriteGenres = (
        <div>
            <div className="flex w-full gap-3 items-center justify-around h-20">
                {
                    (true) ? (
                        populateGenres().map((x, key) => {
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
    )


    return (
        <div className="py-6 border-b border-gray-800 h-full">

            {profileHeader}
            {statistics}
            {favoriteGenres}

        </div>
    )
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