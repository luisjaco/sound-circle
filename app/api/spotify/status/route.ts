import { NextResponse } from "next/server";
import { getSpotifyTokens } from "@/lib/spotify";

// this route is used by the frontend to read the spotify connection status
export async function GET() {
    const tokens = await getSpotifyTokens();
    return NextResponse.json({ connected: !!tokens });
}