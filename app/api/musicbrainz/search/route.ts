import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/musicbrainz/search
 * 
 * search musicbrainz for tracks, artists, or albums by name
 * query params: ?q=search_term&type=recording|artist|release-group
 */

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const type = searchParams.get('type') || 'recording';    // default to recording (in case no type is provided)

        // validate query
        if (!query || query.trim() === '') {
            return NextResponse.json(
                { error: 'Query parameter "q" is required' },
                { status: 400 }
            );
        }

        // construct search query for musicbrainz
        const MB_BASE = 'https://musicbrainz.org/ws/2';
        const searchUrl = `${MB_BASE}/${type}?query=${encodeURIComponent(query)}&fmt=json&limit=20`;

        // send get request to musicbrainz
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'SoundCircle/1.0.0 (https://github.com/luisjaco/sound-circle)',
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`MusicBrainz API returned ${response.status}`);
        }

        const data = await response.json();

        let results;

        // format results based on type
        if(type === 'recording') {
            results = data.recordings.map((rec: any) => ({
                id: rec.id,
                title: rec.title,
                artist: rec['artist-credit']?.map((ac: any) => ac.name).join(', ') || 'Unknown',
                score: rec.score
            })) || [];
        } else if (type === 'artist') {
            results = data.artists?.map((a: any) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                score: a.score
            })) || [];
        } else if (type === 'release-group') {
            results = data['release-groups']?.map((rg: any) => ({
                id: rg.id,
                title: rg.title,
                artist: rg['artist-credit']?.map((ac: any) => ac.name).join(', ') || 'Unknown',
                type: rg['primary-type'],   // indicate album, single, etc
                score: rg.score
            })) || [];
        }

        return NextResponse.json({ 
            query,
            type,
            count: results.length,
            results 
        });

    } catch (error: any) {
        console.error('MusicBrainz search error:', error);
        return NextResponse.json(
            { error: error.message || 'Search failed' },
            { status: 500 }
        );
    }
}