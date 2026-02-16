import { NextRequest, NextResponse } from 'next/server';
import { resolveTracks, type TrackInput } from '@/lib/musicbrainz';

/**
 * POST /api/musicbrainz/lookup
 *
 * Accepts an array of tracks and resolves each to a MusicBrainz recording ID.
 * Uses ISRC lookup first, then falls back to text search.
 *
 * Body: { tracks: TrackInput[] }
 * Response: { results: TrackResult[] }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const tracks: TrackInput[] = body.tracks;

        if (!Array.isArray(tracks) || tracks.length === 0) {
            return NextResponse.json(
                { error: 'Request body must include a non-empty "tracks" array' },
                { status: 400 }
            );
        }

        // Cap at 50 tracks per request to prevent abuse
        if (tracks.length > 50) {
            return NextResponse.json(
                { error: 'Maximum 50 tracks per request' },
                { status: 400 }
            );
        }

        const results = await resolveTracks(tracks);

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('MusicBrainz lookup error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
