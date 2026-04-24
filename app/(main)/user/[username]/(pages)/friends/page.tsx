'use server'

import { createClient } from "@/lib/supabase/server"
import { getClient, getProfile } from "../../queries";
import { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import FriendsContent from "./components/FriendsContent";
import ShortHeader from "./components/ShortHeader";

type Friend = {
    id: string,
    username: string,
    name: string,
    city?: string,
    state?: string,
    profile_picture_url?: string,
    follower: boolean,
    following: boolean,
    currentUserFollowing: boolean
}


export default async function FriendsPage({ params }: { params: { username: string } }) {
    // will function as a wrapper to access friends and following quickly.
    const supabase = await createClient();
    const { username } = await params;

    // optimized
    const [profile, pageUserId, viewingUserId] = await Promise.all([
        getProfile(supabase, username),
        getId(username, supabase),
        getClient(supabase)
    ])

    const relevantProfile = {
        username: username,
        profilePicture: profile.profile_picture_url || '',
        city: profile.city,
        state: profile.state,
        bio: profile.bio,
        name: profile.name
    }

    const { followers, following } = await checkFriends(pageUserId, supabase);

    const users = combineUsers(followers, following);

    const currentUserFollowingIds = await checkViewingUserFollowing(viewingUserId, users, supabase);

    // alter all to include whether or not already following
    const friends = completeFriends(users, currentUserFollowingIds);


    return (<div className='w-full h-full flex flex-col items-center pt-20 gap-10'>
        <ShortHeader profile={relevantProfile} />
        <FriendsContent
            friends={friends}
            pageUserId={pageUserId}
            viewingUserId={viewingUserId}
        />
    </div>)
}

async function getId(username: string, supabase: SupabaseClient) {
    // retrieve page user id
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

    if (error) {
        console.error(`error when finding viewingUserId with username (${username})`);
        notFound();
    }

    return data.id;
}

async function checkFriends(pageUserId: string, supabase: SupabaseClient) {
    // will find both friends and following with detailed information (profile picture, username, name)
    const followingQuery = supabase
        .from('friends')
        .select(`
            user_id,
            following,
            users!friends_following_fkey (
                id,
                username,
                name,
                profile_picture_url,
                city,
                state
            )
            `)
        .eq('user_id', pageUserId)

    const followersQuery = supabase
        .from('friends')
        .select(`
            user_id,
            following,
            users!friends_user_id_fkey (
                id,
                username,
                name,
                profile_picture_url,
                city,
                state
            )
            `)
        .eq('following', pageUserId)

    const [following, followers] = await Promise.all([followingQuery, followersQuery])

    if (followers.error || following.error) {
        console.error(`there was an error when retrieving the friends for user ${pageUserId}`)
        followers.error && console.error(followers.error)
        following.error && console.error(following.error)
        notFound()
    }

    const followersFlattened = followers.data.map((x) => x.users)
    const followingFlattened = following.data.map((x) => x.users)

    return { following: followingFlattened, followers: followersFlattened }
}

async function checkViewingUserFollowing(viewingUserId: string, users: any, supabase: SupabaseClient) {
    // combine lists and exclude duplicates. finds which users the current user follows based off of
    // the page user.
    if (!users) return null // no friends </3

    const ids = new Set(
        users.map((x: any) => x.id)
    )

    if (!ids) return null // no friends except self </3

    const { data, error } = await supabase
        .from('friends')
        .select('following')
        .eq('user_id', viewingUserId)
        .in('following', [...ids])

    if (error) {
        console.error(`there was an error when finding the matching friends for user (${viewingUserId}).`);
        console.error(error);
    }

    const followingFlattened = data?.map((x) => x.following)
    return followingFlattened
}

function combineUsers(followers: any, following: any) {

    const followingIds = new Set(
        following.map((x: any) => x.id)
    )

    const seen: Set<string> = new Set();
    const combinedUsers = []
    // iterate through followers, then following,
    for (const user of followers) {
        const data = {
            follower: true,
            following: followingIds.has(user.id),
            ...user
        }
        combinedUsers.push(data)
        seen.add(user.id) // will be used when we iterate through following list
    }

    // we can verify that any followed user found here is not a follower, as they would have been seen.
    for (const user of following) {
        // if seen skip.
        if (!seen.has(user.id)) {
            const data = {
                follower: false,
                following: true,
                ...user
            }
            combinedUsers.push(data)
        }
    }

    return combinedUsers;
}

function completeFriends(users: any, currentUserFollowingIds: any) {
    const ids = new Set(currentUserFollowingIds)

    const friends = []
    for (const user of users) {
        const f: Friend = {
            currentUserFollowing: ids.has(user.id),
            ...user
        }
        friends.push(f)
    }

    return friends;
}