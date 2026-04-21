import { NextRequest, NextResponse } from "next/server";
import { spotifyFetch } from "@/lib/spotify";

export async function GET(request: NextRequest) {
    try {
        // spotifyFetch automatically handles token retrieval, 401s, and refresh
        const response = await spotifyFetch(
            'https://api.spotify.com/v1/me/player/recently-played?limit=30',
        );

        if(!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch recent tracks'},
                { status: response.status }
            );
        }    
        
        const data = await response.json();

        /* format the raw json response
        const formattedTracks = data.items.map((item: any, index: number) => ({
            number: index + 1,
            trackName: item.track.name,
            artist: item.track.artists[0].name,
            album: item.track.album.name,
            playedAt: new Date(item.played_at).toLocaleString(),
            isrc: item.track.external_ids?.isrc || null
        }));
        */

        return NextResponse.json(data, {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });

    } catch (error: any) {
        // spotifyFetch throws an error if tokens are missing or refresh fails
        return NextResponse.json(
            { error: error.message || 'Spotify error' },
            { status: 401 }
        );
    }
}