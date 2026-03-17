"use client"

/**@todo 
 * given an artistId or musicBrainzId:
 * this component will use an api router which returns the artists profile image, genre, and such
 * it will show the loading component while its loading the response, and once the query has returned
 * it will show the artist data. (manage with state)
 * 
 * note: when this is done, remove the all mentions of 'manualOverride' and 'm' within this component
 */


import { useRouter } from 'next/navigation';
import { ImageWithFallback } from './img/ImageWithFallback';
import { Music } from 'lucide-react';

export default function Artist(props: {
    key: number,
    artistId: number,
    spotifyId?: string,
    appleMuiscId?: string,
    musicBrainzId?: string,
    manualOverride?: {
        artistId: number,
        name: string,
        image: string,
        genres: string[],
    }
}) {

    const router = useRouter();
    const m = props.manualOverride;

    const manualArtist = m ? (
        <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push("/artist")}
        >
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#1ed760] transition-all shrink-0">
                {m.image ? (
                    <ImageWithFallback
                        src={m.image}
                        alt={m.name}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                        <Music className="w-5 h-5 text-gray-600" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-white text-xs truncate">
                    {m.name}
                </p>
                {m.genres.length > 0 && (
                    <p className="text-gray-500 text-[10px] truncate">
                        {m.genres.slice(0, 2).join(", ")}
                    </p>
                )}
            </div>
        </div>
    ) : null;

    const loadingArtist = (
        <div className="flex items-center gap-3" style={{ animationDelay: `150ms` }}>
            <div className="w-12 h-12 rounded-full bg-gray-800 animate-pulse shrink-0" style={{ animation: `150ms` }} />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-gray-800 rounded-full animate-pulse" style={{ animationDelay: `150ms` }} />
                <div className="h-2 w-14 bg-gray-800/60 rounded-full animate-pulse" style={{ animationDelay: `225ms` }} />
            </div>
        </div>
    )

    return (
        <>
            {m ? (
                manualArtist
            ): (
                loadingArtist
            )
}
        </>
    );
}