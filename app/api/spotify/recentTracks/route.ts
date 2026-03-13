import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = 'BQD3Rza5f99dToX9tu8BzZaEO0jsz78L3FHXgK_tNJQ1C_m5yxykuOQYUNiruRj1sxQxosAbeFNZj4tFtxaabk6_HeMwpZmcmv2uc2non-2ytN6nwttuRMPMM_GCt04uYLgPIAzdIAxHp-ZDWs9DwG3LLX_69Bt8ciOq7eWJjYx1rNy6G-K4k2VMcLr3hqSBX0aX_GoueQ-EDZjtVIR6NWaZ8ycFcQgHBM5DU2jx';

    // fetch the user's recently played tracks
    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

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
}