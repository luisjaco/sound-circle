import 'server-only';
import { createClient } from "../server";

export async function follow(userId: string, followId: string) {
    console.log(`User ${userId} attempting to follow ${followId}`)
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('friends')
        .insert(
            {
                user_id: userId,
                following: followId
            }
        )

    if ( error ) {
        console.error(`Error when user ${userId} attemped to follow ${followId}`)
        console.error(error);
        return false;
    }

    return true;
}

export async function unfollow(userId: string, followId: string) {
    console.log(`User ${userId} attempting to unfollow ${followId}`);
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('friends')
        .delete()
        .match({
            user_id: userId,
            following: followId
        });

    if ( error ) {
        console.error(`Error when user ${userId} attempted to unfollow ${followId}`);
        console.error(error);
        return false;
    }

    return true;
}