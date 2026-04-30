import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isModerator } from '@/lib/supabase/moderation';
import supabase from '@/lib/supabase/admin'; 

// MOD-ONLY ROUTE
// PATCH issues a warning, bans, or unbans a user

// - warn: sets warned = true on the users table
// - ban:  sets banned = true on the users table
// - unban: sets banned = false on the users table

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // auth check with regular client
        const authClient = await createClient();
        const { data: { user }, error: authError } = await authClient.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // mod check with admin client (bypasses rls)
        const mod = await isModerator(supabase, user.id);
        if (!mod) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
 
        const { id: targetUserId } = await params;
        if (!targetUserId) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }
 
        // prevent mods from actioning themselves
        if (targetUserId === user.id) {
            return NextResponse.json(
                { error: 'You cannot perform moderation actions on your own account' },
                { status: 400 }
            );
        }
 
        let body: { action?: string };
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
 
        const { action } = body;
 
        if (action !== 'warn' && action !== 'ban' && action !== 'unban') {
            return NextResponse.json(
                { error: 'Invalid action. Must be warn, ban, or unban' },
                { status: 400 }
            );
        }
 
        // confirm target user exists
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('id, banned, warned')
            .eq('id', targetUserId)
            .single();
 
        if (userError || !targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
 
        // warn
        if (action === 'warn') {
            if (targetUser.warned) {
                return NextResponse.json({ error: 'User has already been warned' }, { status: 409 });
            }
 
            const { error: warnError } = await supabase
                .from('users')
                .update({ warned: true })
                .eq('id', targetUserId);
 
            if (warnError) {
                console.error('Failed to warn user:', warnError);
                return NextResponse.json({ error: 'Failed to issue warning' }, { status: 500 });
            }
 
            return NextResponse.json({ message: 'Warning issued successfully.' });
        }
 
        // ban
        if (action === 'ban') {
            if (targetUser.banned) {
                return NextResponse.json({ error: 'User is already banned' }, { status: 409 });
            }
 
            const { error: banError } = await supabase
                .from('users')
                .update({ banned: true })
                .eq('id', targetUserId);
 
            if (banError) {
                console.error('Failed to ban user:', banError);
                return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
            }
 
            return NextResponse.json({ message: 'User banned successfully.' });
        }
 
        // unban
        if (action === 'unban') {
            if (!targetUser.banned) {
                return NextResponse.json({ error: 'User is not banned' }, { status: 409 });
            }
 
            const { error: unbanError } = await supabase
                .from('users')
                .update({ banned: false, warned: false })
                .eq('id', targetUserId);
 
            if (unbanError) {
                console.error('Failed to unban user:', unbanError);
                return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
            }
 
            return NextResponse.json({ message: 'User unbanned successfully.' });
        }
 
    } catch (error: any) {
        console.error('User moderation route error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}