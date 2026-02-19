import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = 'BQAVgvHTNA2Vs5GMyMh_2f0ZaBdErBezIuqbBP80IOzSqGlrt3SxqIl1RBRyBOq7xKgimK8mQD5Ky1p5e_9ndgBLUPSO8TR6EZBil-Q0s7vd3bvvuZ3jR8bQqcYH1JEkjesQ230IP0d_0P1zBhIK256Xx-Pn3DAy1CDCIYheW_eXorPXEam0lD-Toa-8yDxcmwAZv8phyBKI684SmyYnfyoX6QMJlYuIwtX8xUcv';

    // fetch the user's recently played tracks
    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();

    // format the raw json response
    const formattedTracks = data.items.map((item: any, index: number) => ({
        number: index + 1,
        trackName: item.track.name,
        artist: item.track.artists[0].name,
        album: item.track.album.name,
        playedAt: new Date(item.played_at).toLocaleString()
    }));


    return NextResponse.json(formattedTracks, {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
}