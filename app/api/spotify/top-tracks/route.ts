import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = 'BQAVgvHTNA2Vs5GMyMh_2f0ZaBdErBezIuqbBP80IOzSqGlrt3SxqIl1RBRyBOq7xKgimK8mQD5Ky1p5e_9ndgBLUPSO8TR6EZBil-Q0s7vd3bvvuZ3jR8bQqcYH1JEkjesQ230IP0d_0P1zBhIK256Xx-Pn3DAy1CDCIYheW_eXorPXEam0lD-Toa-8yDxcmwAZv8phyBKI684SmyYnfyoX6QMJlYuIwtX8xUcv';

    // fetch the user's top tracks (last 6 months)
    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();

    // format the raw json response
    const formattedTracks = data.items.map((track: any, index: number) => ({
        number: index + 1,
        trackName: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        popularity: track.popularity,
    }));


    return NextResponse.json(formattedTracks);
}

// AVAILABLE TIME RANGES FOR TOP SONGS: 
// short_term: last 4 weeks
// medium_term: last 6 months
// long_term: all time