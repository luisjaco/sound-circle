import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = 'BQCdKceGQX7Aq74OQLtMzQRr1ewatuTW2Se5JVAIV48Ux0Ojrxg-QxEtNmma8UHJD_R-Y9ycjLMKcLZsOKxIUfq3W0Lnv_TL_cv7RBGX5JmtWUGEV-ED9Ua55AD9tPq_A-p0I4aM2Ec_By4_ORvx0BRcB5WxfegG8_8CgtEGV2RUbLuXMe6YOkxW1b54CSfyAx_wrlunYyVGYpbuegCm8_3KUPKZX6d8HqSLl5wQ';

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
        isrc: track.external_ids?.isrc || null
    }));


    return NextResponse.json(formattedTracks);
}

// AVAILABLE TIME RANGES FOR TOP SONGS: 
// short_term: last 4 weeks
// medium_term: last 6 months
// long_term: all time