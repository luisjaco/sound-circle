import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = 'BQAAsCKktWJqO32Ur2plTs6-US42dfZz8WAXyT86gcyuDO1bIpkaYcLDIkOs1BPeZxeegJmZztNhIBe7x5PlmIIjpajsj3tiMd21vq74F3-fwVLX9Oa3eVK8apX5LwrEFDRyyGWqjk0BYBF0HZsLkoalvTyvZo_jQiMclI7K_muKKn6tHScuaGauDPbOpbsV-kWtqJqngMkKNuzjtQernO9Y6qG0ctWSCAZIQEkZ';

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
        playedAt: new Date(item.played_at).toLocaleString(),
        isrc: item.track.external_ids?.isrc || null
    }));


    return NextResponse.json(formattedTracks, {
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
}