import { NextRequest, NextResponse } from "next/server";
import { getClientToken } from "@/lib/spotify";

/** @todo untested */

export async function GET(req: NextRequest) {
    
    const { searchParams } = new URL(req.url);

    // two different fetches depending on if we're sending one query or multiple.
    const songId = searchParams.get('songId');
    const songIds = searchParams.get('songIds')?.split(',');

    if (!songIds && !songId) {
        return NextResponse.json(
            { error: "Bad Request" },
            { status: 400 }
        );
    }

    const tokenData = await getClientToken();

    if (!tokenData) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    if (songIds) {
        const multiQueryRes = await multiQuery(songIds, tokenData);
        return multiQueryRes;
    }

    if (songId) {
        const singleQueryRes = await singleQuery(songId, tokenData);
        return singleQueryRes;
    }
}

async function singleQuery(id: string, tokenData: any) {

    const res = await fetch(
        `https://api.spotify.com/v1/tracks/${encodeURIComponent(id)}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify song data of id: ${id}`);
        console.error(res);
        return NextResponse.json(
            { error: "Bad Query" },
            { status: 500 }
        )
    }

    return NextResponse.json(data);
}

async function multiQuery(ids: string[], tokenData: any) {

    const body = new URLSearchParams({ ids: ids.join(',') })

    const res = await fetch(
        `https://api.spotify.com/v1/tracks?${body.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify song data of ids: ${ids}`);
        console.error(res);
        return NextResponse.json(
            { error: "Bad Query" },
            { status: 500 }
        )
    };

    return NextResponse.json(data);
}