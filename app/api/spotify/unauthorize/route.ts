import { getSpotifyTokens, logout } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function POST() {

    if ( await getSpotifyTokens() ) { await logout() }    

    return NextResponse.json(
        {status: 200}
    )
}