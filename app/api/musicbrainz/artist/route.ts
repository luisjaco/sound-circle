import { NextRequest, NextResponse } from 'next/server';
import { searchArtist } from '@/lib/musicbrainz';

function matchValidLimit(val: string | null, fallback: number): number {
    if (!val) return fallback;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 || parsed > 50 ? fallback : parsed;
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get('q');

        if (!query || !query.trim()) {
            return NextResponse.json({ results: [] });
        }

        const limitMatch = url.searchParams.get('limit');
        const limit = matchValidLimit(limitMatch, 5);

        let results = await searchArtist(query.trim(), limit + 5); // fetch a bit extra in case we filter some

        results = results
            .filter(a => !['[unknown]', 'various artists', '[no artist]'].includes(a.name.toLowerCase()))
            .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
            .slice(0, limit);

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Artist search route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}