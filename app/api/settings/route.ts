import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
    const supabase = await createClient();

    // get logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if ( authError || !user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // fetch this user's data
    const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (userError || !currentUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();

    const {
        name,
        bio,
        username,
        city,
        state,
        favoriteGenres
    } = body;

    // validate mandatory fields (name, username, and fav genres)
    if (username === undefined || typeof username !== 'string' || username.trim() === '') {
        return Response.json({ error: 'Username is required' }, { status: 400 });
    }

    if (name === undefined || typeof name !== 'string' || name.trim() === '') {
        return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    if (favoriteGenres === undefined || !Array.isArray(favoriteGenres) || favoriteGenres.length === 0) {
        return Response.json({ error: 'At least one favorite genre is required' }, { status: 400 });
    }
    for (const genre of favoriteGenres) {
        if(!genre.id) {
            return Response.json({ error: 'Invalid genre object' }, { status: 400 });
        }
    }

    
    // check username validity (uniqueness)
    if(username !== currentUser.username) {
        const { data: existingUser, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .maybeSingle();

        if(error) {
            return Response.json({ error: 'Error checking username' }, { status: 500});
        }
        if (existingUser) {
            return Response.json({ error: 'Username already taken' }, { status: 400 });
        }
    }    

    // update user data
    const updateData: any = {
        name,
        username
    };

    if(bio !== undefined) updateData.bio = bio;
    if(city !== undefined) updateData.city = city;
    if(state !== undefined) updateData.state = state;

    const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

    if (updateError) {
        console.error(updateError);
        return Response.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    const { error: deleteGenresError } = await supabase        
        .from('user_favorite_genres')
        .delete()
        .eq('user_id', user.id);
    
    if (deleteGenresError) {
        console.error(deleteGenresError);
        return Response.json({ error: 'Failed to clear favorite genres' }, { status: 500 });
    }

    const genreRows = favoriteGenres.map((genre: any) => ({
        user_id: user.id,
        genre_id: genre.id
    }));

    const { error: genreError } = await supabase
        .from('user_favorite_genres')
        .insert(genreRows);

    if (genreError) {
        console.error(genreError);
        return Response.json({ error: 'Failed to update favorite genres' }, { status: 500 });
    }

    return Response.json({ message: 'Profile updated successfully' });
}