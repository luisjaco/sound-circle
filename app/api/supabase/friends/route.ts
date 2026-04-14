import { NextRequest, NextResponse } from 'next/server';
import { follow, unfollow } from '@/lib/supabase/table/friends';

export async function POST(req: NextRequest) {
    const body = await req.json();

    const userId = body.userId;
    const followId = body.followId;
    const action = body.action;

    if (
        !userId ||
        !followId ||
        !(action === 'follow' || 'unfollow')
    ) {
        return NextResponse.json(
            { error: "Bad Request" },
            { status: 400 }
        )
    }

    if (action === 'follow') {
        const f = await follow(userId, followId);

        if (!f) {
            return NextResponse.json(
                { error: "Failed to insert into friends table." },
                { status: 500 }
            )
        }
    }

    if (action === 'unfollow') {
        const f = await unfollow(userId, followId);

        if (!f) {
            return NextResponse.json(
                { error: "Failed to delete from friends table." },
                { status: 500 }
            )
        }
    }

    return NextResponse.json(
        { message: 'success', success: true},
        { status: 200 }
    )
}