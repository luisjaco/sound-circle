'use client'
import { ImageWithFallback } from "@/components/img/ImageWithFallback"
import { createClient } from "@/lib/supabase/browser"
import { Check, ListVideo, PencilIcon, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useRef, useState } from "react"

type ListHeaderProps = {
    id: number,
    title: string,
    created_at: string,
    updated_at?: string,
    user_id: string,
    cover_image_url?: string,
    description?: string,
    user_name: string,
    username: string
    profile_picture_url?: string,
    owner: boolean
}



export default function ListHeader({
    id,
    title,
    created_at,
    updated_at,
    user_id,
    cover_image_url,
    description,
    user_name,
    username,
    profile_picture_url,
    owner,
}: ListHeaderProps) {

    const createdTimeAgo = getTimeAgo(created_at);
    const [updatedAtTimeAgo, setUpdatedAtTimeAgo] = useState(updated_at && getTimeAgo(updated_at))

    const [inserting, setInserting] = useState(false);
    const [error, setError] = useState(false);
    const [editing, setEditing] = useState(false);
    const [success, setSuccess] = useState(false);

    const [prevImageUrl, setPrevImageUrl] = useState<string | null>(cover_image_url || null);
    const [newListImageUrl, setNewListImageUrl] = useState<string | null>(cover_image_url || null);
    const [newListImageFile, setNewListImageFile] = useState<File | null>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [prevTitle, setPrevTitle] = useState(title);
    const [newTitle, setNewTitle] = useState(title);
    const [newTitleError, setNewTitleError] = useState(false);

    const [prevDescription, setPrevDescription] = useState(description);
    const [newDescription, setNewDescription] = useState(description);

    const supabase = createClient();
    const router = useRouter();

    const handleRemovePhoto = () => {
        setNewListImageUrl(null);
        setNewListImageFile(null);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setNewListImageUrl(imageUrl);
        setNewListImageFile(file);
    };

    const fileButtonPress = () => {
        // remove photo when photo present.
        if (newListImageUrl) {
            handleRemovePhoto();
            return;
        }

        fileInputRef.current?.click()
    }

    const cancelEdit = () => {
        if (inserting) return;

        setNewTitle(prevTitle);
        setNewDescription(prevDescription);
        setNewListImageUrl(prevImageUrl);
        setNewListImageFile(null);

        setEditing(false);
    }

    const submit = async () => {
        if (inserting) return;

        setSuccess(false);
        setError(false);
        // do not allow empty titles
        if (newTitle.length <= 0) {
            setNewTitleError(true);
            return;
        }

        // check that there are changes
        if (
            (newTitle === prevTitle) &&
            (newDescription === prevDescription) &&
            (newListImageUrl === prevImageUrl)
        ) {
            setEditing(false);
            return;
        }


        setNewTitleError(false);
        setInserting(true);

        const insert = await createEdit();

        if (!insert) {
            setError(true);
        }
        else {
            setSuccess(true);
            setEditing(false);
            setInserting(false);
            setPrevTitle(newTitle);
            setPrevDescription(newDescription);
            setUpdatedAtTimeAgo('0s');
        }

    }

    const createEdit = async () => {
        // grab user
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            return null;
        }

        const userId = data.user.id;

        // insert image if applicable
        let imagePath = '';
        if ((newListImageUrl)) {
            if (newListImageUrl === prevImageUrl) {
                imagePath = prevImageUrl;
            }
            else if (newListImageFile) {
                const fileName = `list_${Date.now()}_${Math.random()}`;
                const filePath = `${userId}/${fileName}`;

                const { error } = await supabase
                    .storage
                    .from('list_images')
                    .upload(filePath, newListImageFile);

                if (error) {
                    console.error(`error occured when inserting image for user (${userId})`)
                    console.error(error);
                    return null;
                } else {
                    const { publicUrl } = await supabase
                        .storage
                        .from('list_images')
                        .getPublicUrl(filePath)
                        .data;

                    if (publicUrl) {
                        imagePath = publicUrl;
                    }
                    else {
                        return null;
                    }
                }
            }
        }

        // update list
        const listQuery = await supabase
            .from('user_lists')
            .update({
                title: newTitle,
                description: newDescription,
                cover_image_url: imagePath,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user_id);

        if (listQuery.error) {
            console.error(`error occured when inserting list for user (${userId})`)
            console.error(listQuery.error);
            return null
        };

        setPrevImageUrl(imagePath);
        return true;
    }

    const imageSection = (
        <div className='flex flex-col gap-4'>
            <div className="w-72 h-72 rounded-md overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#9fddb5] transition-all shrink-0 flex justify-center items-center">
                {
                    newListImageUrl ? (
                        <ImageWithFallback
                            src={newListImageUrl}
                            alt={`list picture`}
                            className="w-full h-full rounded-md object-cover"
                        />
                    ) :
                        <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center">
                            <ListVideo className="w-16 h-16 text-gray-600" />
                        </div>
                }
            </div>

            <div className="flex flex-col gap-3 w-full" hidden={!editing}>
                <button
                    onClick={fileButtonPress}
                    className={`w-full bg-[#282828] hover:bg-[#383838] text-white py-2 rounded-lg transition-colors cursor-pointer
                        ${newListImageUrl && 'hover:bg-red-400'}`}
                >
                    {newListImageUrl ? 'Remove photo' : 'Upload photo'}
                </button>
                <p className="text-gray-500 text-xs text-center">
                    JPG, PNG — up to 5MB.
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </div>
    )

    const user = (
        <div className="flex items-center gap-3 mb-4">
            <div
                className='cursor-pointer'
                onClick={() => router.push(`/user/${username}`)}
            >
                {profile_picture_url ? (
                    <ImageWithFallback
                        src={profile_picture_url}
                        alt={username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1DB954] to-emerald-700 flex items-center justify-center ring-2 ring-gray-700 hover:ring-[#1DB954] transition-all">
                        <span className="text-white font-bold text-sm">
                            {username}
                        </span>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 cursor-pointer">
                    <div
                        onClick={() => router.push(`/user/${username}`)}
                        className="text-white font-medium hover:text-[#1DB954] transition-colors truncate"
                    >
                        {user_name || username}
                    </div>
                </div>
                <p className="text-gray-500 text-xs">
                    @{username}
                </p>
            </div>
        </div>
    )

    const editingAside = (
        <div className="mb-auto w-10" hidden={!owner}>
            <div hidden={editing} className='w-10 h-9'>
                <PencilIcon
                    className={`w-9 h-9 hover:text-[#1DB954] transition-colors cursor-pointer`}
                    onClick={() => setEditing(true)}
                />
            </div>
            <div className='mb-auto' hidden={!editing}>
                <X
                    className={`w-10 h-10 hover:text-red-500 transition-colors cursor-pointer`}
                    onClick={cancelEdit}
                />
            </div>
            <div className='mb-auto mt-10' hidden={!editing}>
                <Check
                    className={`w-10 h-10 hover:text-[#1DB954] transition-colors cursor-pointer`}
                    onClick={submit}
                />
            </div>
        </div>
    )

    return (<div className="bg-[#181818] rounded-xl max-w-6xl p-5 border border-gray-800/50 flex flex-col gap-4 mt-15 mx-auto">
        <header className="grid grid-cols-[auto_1fr_auto] gap-x-8 w-full h-full items-start">

            {/* Image (spans all rows) */}
            <div className="row-span-3">
                {imageSection}
            </div>

            {/* Title */}
            <div className="mt-10">
                <div className="flex flex-col">
                    <input
                        disabled={!editing}
                        placeholder="List Title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className={`
                    text-5xl font-bold box-border pb-1 w-full focus:outline-none transition-colors
                    ${editing && 'border-b border-white focus:border-[#1DB954]'}
                `}
                    />
                    <label className={`text-red-500 text-sm mt-2 ${newTitleError ? 'visible' : 'invisible'}`}>
                        Title is a required field.
                    </label>
                </div>
            </div>

            {/* Editing Aside (top right only) */}
            <div>
                {editingAside}
            </div>

            {/* Description */}
            <div>
                <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    disabled={!editing}
                    placeholder={editing ? 'List Description' : ''}
                    className={`w-full text-gray-400 text-lg whitespace-pre-wrap font-mono mt-2 wrap-break-words p-1 rounded-lg focus:outline-none
            ${editing && 'bg-[#0a0a0a] text-white focus:border-[#1DB954]'}
            placeholder-gray-500 transition-colors resize-none min-h-30`}
                />
            </div>

            {/* Empty spacer for right column (optional, keeps alignment clean) */}
            <div />

            {/* User Info */}
            <div className="flex flex-row gap-6 ml-auto">
                {user}
                <div className="flex flex-col">
                    <p className="text-gray-500 text-sm">Created {createdTimeAgo} ago</p>
                    {updatedAtTimeAgo && (
                        <p className="text-gray-500 text-xs italic">
                            Updated {updatedAtTimeAgo} ago
                        </p>
                    )}
                </div>
            </div>
        </header>
        <label hidden={!error} className={`text-red-500 text-sm mt-2 mx-auto`}>
            There was an error when updating your list.
        </label>
        <label hidden={!success} className={`text-[#1DB954] text-sm mt-2 mx-auto `}>
            List successfully updated.
        </label>
    </div>)
}

function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 52) return `${diffWeeks}w`;
    return then.toLocaleDateString();
}