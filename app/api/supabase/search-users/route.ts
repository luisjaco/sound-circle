import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/supabase/search-users
 *
 * Search the Supabase 'users' table by one or more parameters.
 * At least one query parameter is required.
 *
 * Query params:
 *   ?id=<uuid>           — exact match on user id
 *   ?name=<text>         — partial match on name
 *   ?username=<text>     — partial match on username
 *   ?city=<text>         — partial match on city
 *   ?state=<text>        — partial match on state
 *
 * If only a few letters are provided for name/username/city/state,
 * ilike will return the most relevant (prefix-matching) results.
 */

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const id = searchParams.get('id');
        const name = searchParams.get('name');
        const username = searchParams.get('username');
        const city = searchParams.get('city');
        const state = searchParams.get('state');

        // at least one parameter must be specified
        if (!id && !name && !username && !city && !state) {
            return NextResponse.json(
                {
                    error:
                        'At least one query parameter is required: id, name, username, city, or state',
                },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // start building the query
        let query = supabase.from('users').select('*');

        // exact match for id (uuid)
        if (id) {
            query = query.eq('id', id);
        }

        // partial match for name (case-insensitive)
        if (name) {
            query = query.ilike('name', `%${name}%`);
        }

        // partial match for username (case-insensitive)
        if (username) {
            query = query.ilike('username', `%${username}%`);
        }

        // partial match for city (case-insensitive)
        if (city) {
            query = query.ilike('city', `%${city}%`);
        }

        // partial match for state (case-insensitive)
        if (state) {
            query = query.ilike('state', `%${state}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase search-users error:', error);
            return NextResponse.json(
                { error: error.message || 'Search failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            count: data.length,
            results: data,
        });
    } catch (error: any) {
        console.error('search-users error:', error);
        return NextResponse.json(
            { error: error.message || 'Search failed' },
            { status: 500 }
        );
    }
}
