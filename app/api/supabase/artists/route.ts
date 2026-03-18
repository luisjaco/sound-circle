import supabase from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/supabase/artists
 * 
 * Looks up an artist by musicbrainz_id in the artists table.
 * - If found, returns the existing row.
 * - If not found, creates a new row with the musicbrainz_id and artist name,
 *   then returns the newly created row.
 * 
 * Body: { musicbrainz_id: string, name?: string }
 * Response: { artist: { id, musicbrainz_id, ... }, created: boolean }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { musicbrainz_id, name } = body;

        if (!musicbrainz_id || typeof musicbrainz_id !== 'string') {
            return NextResponse.json(
                { error: 'musicbrainz_id is required and must be a string' },
                { status: 400 }
            );
        }

        // Step 1: Check if artist already exists in our database
        const { data: existingArtist, error: lookupError } = await supabase
            .from('artists')
            .select('*')
            .eq('musicbrainz_id', musicbrainz_id)
            .maybeSingle();

        if (lookupError) {
            console.error('Artist lookup error:', lookupError);
            return NextResponse.json(
                { error: 'Failed to look up artist' },
                { status: 500 }
            );
        }

        // If the artist already exists, return it
        if (existingArtist) {
            return NextResponse.json({
                artist: existingArtist,
                created: false,
            });
        }

        // Artist doesn't exist — create a new row
        // Let Supabase generate the primary key (uuid default)
        const { data: newArtist, error: insertError } = await supabase
            .from('artists')
            .insert({
                musicbrainz_id,
            })
            .select('*')
            .single();

        if (insertError) {
            console.error('Artist insert error:', insertError);
            return NextResponse.json(
                { error: 'Failed to create artist' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            artist: newArtist,
            created: true,
        });
    } catch (error: any) {
        console.error('Artists route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
