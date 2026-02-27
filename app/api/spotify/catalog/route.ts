import { NextRequest, NextResponse } from "next/server";
import { resolveTracks, type TrackInput, type TrackResult } from "@/lib/musicbrainz";

// simplified structure of a raw spotify track response
interface SpotifyTrack {
    album?: { 
        type?: string;
        artists?: any[];
        href?: string;
        id?: string;
        name: string
        uri?: string;
        [key: string]: any;
    };
    artists: Array<{ 
        external_urls?: any;
        href?: string;
        id?: string;
        name: string;
        type?: string;
        uri?: string;
    }>;
    duration_ms?: number;
    external_ids?: { 
        isrc?: string 
    };
    id: string;
    name: string;
    [key: string]: any;
}

/**
 * POST /api/spotify/catalog
 * 
 * takes spotify track IDs and prepares them for mmatching with musicbrainz
 * extracts ISRCs and calls the musicbrainz resolver
 * 
 * body: { trackIds: SpotifyTrack[] }
 * response: { results: TrackResult[] }
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const tracks: SpotifyTrack[] = body.items;

        if (!Array.isArray(tracks) || tracks.length === 0) {
            return NextResponse.json(
                { error: 'Request body must include a non-empty "tracks" array' }, 
                { status: 400 });
        }

        // cap at 50 tracks per request to prevent abuse
        if (tracks.length > 50) {
            return NextResponse.json(
                { error: 'Maximum 50 tracks allowed per request' }, 
                { status: 400 });
        }

        // transform spotify tracks into trackinput format for musicbrainz resolver
        const trackInputs: TrackInput[] = tracks.map(track => ({
            sourceId: track.id,
            platform: 'spotify',
            name: track.name,
            artistName: track.artists[0]?.name || 'Unknown Artist',
            albumName: track.album?.name,
            durationInMillis: track.duration_ms,
            isrc: track.external_ids?.isrc
        }));

        // send spotofy tracks into musicbrainz resolver
        const results = await resolveTracks(trackInputs);
        return NextResponse.json({ results });
    } catch (err: any) {
        console.error('Spotify catalog error:', err);
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 });
    };
}