import { NextResponse } from "next/server";

// clears spotify cookies from a previous connection on the same browser
// called when a new user starts onboarding

export async function POST() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('spotify_access_token');
    response.cookies.delete('spotify_refresh_token');
    return response;
}