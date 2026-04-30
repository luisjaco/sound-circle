import { createClient } from "@/lib/supabase/server";

// route handler for /api/settings
// handler for fetching current user settings
export async function GET() {
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
    
    return Response.json({ user: currentUser });
}

// handles updating username, name, bio, location, and profile picture
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

    // parse form data
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const bio = formData.get('bio') as string | null;
    const city = formData.get('city') as string | null;
    const state = formData.get('state') as string | null;
    const profilePicture = formData.get('profilePicture');
    const currentPassword = formData.get('currentPassword') as string | null;
    const newPassword = formData.get('newPassword') as string | null;

    // change password (if given)
    if (currentPassword || newPassword) {
        if (!currentPassword || !newPassword) {
            return Response.json(
                { error: 'Both current and new passwords are required' },
                { status: 400 }
            );
        }
        const safeCurrentPassword = currentPassword as string;
        const safeNewPassword = newPassword as string;

        const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
        if (!passwordRegex.test(safeNewPassword)) {
            return Response.json(
                { error: 'New password must be at least 8 characters and include an uppercase, lowercase, numbers, and special character' },
                { status: 400 }
            );
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
            email: user.email!,
            password: safeCurrentPassword
        });
        if (signInError) {
            return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
        const { error: updatePasswordError } = await supabase.auth.updateUser({
            password: safeNewPassword
        });
        if (updatePasswordError) {
            console.error(updatePasswordError);
            return Response.json({ error: 'Failed to update password' }, { status: 500 });
        }
    }

    // validate username
    // basic checks
    if (username === undefined || typeof username !== 'string' || username.trim() === '') {
        return Response.json({ error: 'Username is required' }, { status: 400 });
    }
    const trimmedUsername = username.trim();
    // length checks
    if (trimmedUsername.length < 2) {
        return Response.json({ error: 'Username is too short' }, { status: 400 });
    }
    if(trimmedUsername.length > 20) {
        return Response.json({ error: 'Username must be 20 characters or less' }, { status: 400 });
    }
    // regex check (same as frontend)
    if (!/^[\w.-]+$/.test(trimmedUsername)) {
        return Response.json({
            error: 'Only letters, numbers, and ., _, - are allowed'
        }, { status: 400 });
    }
    // uniqueness check for new username
    if(trimmedUsername !== currentUser.username) {
        const { data: existingUser, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', trimmedUsername)
            .maybeSingle();

        if(error) {
            return Response.json({ error: 'Error checking username' }, { status: 500});
        }
        if (existingUser) {
            return Response.json({ error: 'Username already taken' }, { status: 400 });
        }
    }    

    // validate name
    if (name === undefined || typeof name !== 'string' || name.trim() === '') {
        return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    // keep current image unless a new one is uploaded
    let imagePath = currentUser.profile_picture_url ?? "";

    // validate profile picture (if given)
    if(profilePicture !== null) {
        if(!(profilePicture instanceof File)) {
            return Response.json({ error: 'Invalid file upload' }, { status: 400 });
        }

        const fileName = `pfp_${Date.now()}_${Math.random()}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('profile_images')
            .upload(filePath, profilePicture);

        if (uploadError) {
            console.error(uploadError);
            return Response.json({ error: 'Failed to upload image' }, { status: 500 });
        }

        const { data: publicUrlData } = supabase.storage
            .from('profile_images')
            .getPublicUrl(filePath);

        if(!publicUrlData?.publicUrl) {
            return Response.json({ error: 'Failed to get image URL' }, { status: 500 });
        }

        imagePath = publicUrlData.publicUrl;
    }

    // update users table
    const updateData: any = {
        name,
        username: trimmedUsername,
        profile_picture_url: imagePath
    };
    updateData.bio = bio;
    updateData.city = city;
    updateData.state = state;

    const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

    if (updateError) {
        console.error(updateError);
        return Response.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    return Response.json({ message: 'Profile updated successfully' });
}