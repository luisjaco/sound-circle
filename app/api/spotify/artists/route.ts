import { NextRequest, NextResponse } from "next/server";
import { getClientToken } from "@/lib/spotify";

type TokenData = {
    todo: string,
}

export async function GET(req: NextRequest) {
    
    const { searchParams } = new URL(req.url);

    // two different fetches depending on if we're sending one query or multiple.
    const artistId = searchParams.get('artistId');
    const artistIds = searchParams.get('artistIds')?.split(',');

    if (!artistIds && !artistId) {
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

    if (artistIds) {
        const multiQueryRes = await multiQuery(artistIds, tokenData);
        return multiQueryRes;
    }

    if (artistId) {
        const singleQueryRes = await singleQuery(artistId, tokenData);
        return singleQueryRes;
    }
}

async function singleQuery(id: string, tokenData: any) {

    const res = await fetch(
        `https://api.spotify.com/v1/artists/${encodeURIComponent(id)}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify artist data of id: ${id}`);
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
        `https://api.spotify.com/v1/artists?${body.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        }
    );

    const data = await res.json();

    if (!res.ok) {
        console.error(`error while looking for spotify artist data of ids: ${ids}`);
        console.error(res);
        return NextResponse.json(
            { error: "Bad Query" },
            { status: 500 }
        )
    };

    return NextResponse.json(data);
}