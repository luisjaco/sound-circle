'use client'

import { ImageWithFallback } from "@/components/img/ImageWithFallback";
import { VinylRating } from "@/components/vinyl-rating";
import { createClient } from "@/lib/supabase/browser";
import { ListPlus, ListVideo, Send, X } from "lucide-react";
import { useState, useRef } from "react";

type CreateListProps = {
    setCurrentLists: React.Dispatch<React.SetStateAction<any>>
}

export function CreateList({ setCurrentLists }: CreateListProps) {

    const [active, setActive] = useState(false);
    const [inserting, setInserting] = useState(false);
    const [error, setError] = useState(false);

    const [listImageUrl, setListImageUrl] = useState<string | null>();
    const [listImageFile, setListImageFile] = useState<File | null>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [titleError, setTitleError] = useState(false);

    const [description, setDescription] = useState('');

    const supabase = createClient();

    const handleRemovePhoto = () => {
        setListImageUrl(null);
        setListImageFile(null);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setListImageUrl(imageUrl);
        setListImageFile(file);
    };

    const fileButtonPress = () => {
        // remove photo when photo present.
        if (listImageUrl) {
            handleRemovePhoto();
            return;
        }

        fileInputRef.current?.click()
    }

    const cancel = () => {
        handleRemovePhoto();
        setTitle('');
        setDescription('');
        setActive(false);
        setInserting(false);
    }

    const submit = async () => {
        setError(false);
        // do not allow empty titles
        if (title.length <= 0) {
            setTitleError(true);
            return;
        }

        setTitleError(false);
        setInserting(true);

        const insert = await insertList();

        if (!insert) {
            setError(true)
        }
        else {
            setCurrentLists((l: any) => { return [insert, ...l] })
        }

        setInserting(false);
    }


    const insertList = async () => {
        // grab user
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            return null;
        }

        const userId = data.user.id;

        // insert image if applicable
        let imagePath = '';
        if (listImageUrl && listImageFile) {
            const fileName = `list_${Date.now()}_${Math.random()}`;
            const filePath = `${userId}/${fileName}`;

            const { error } = await supabase
                .storage
                .from('list_images')
                .upload(filePath, listImageFile);

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

        // now insert list
        const listQuery = await supabase
            .from('user_lists')
            .insert({
                user_id: userId,
                title: title,
                description: description,
                cover_image_url: imagePath
            })
            .select(`*`)
            .single();

        if (listQuery.error) {
            console.error(`error occured when inserting list for user (${userId})`)
            console.error(listQuery.error);
            return null
        };

        return listQuery.data;
    }

    const imageSection = (
        <div className='flex flex-col gap-4'>
            <div className="w-48 h-48 rounded-md overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#9fddb5] transition-all shrink-0 flex justify-center items-center">
                {
                    listImageUrl ? (
                        <ImageWithFallback
                            src={listImageUrl}
                            alt={`list picture`}
                            className="w-full h-full rounded-md object-cover"
                        />
                    ) :
                        <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center">
                            <ListVideo className="w-16 h-16 text-gray-600" />
                        </div>
                }
            </div>

            <div className="flex flex-col gap-3 w-full">
                <button
                    onClick={fileButtonPress}
                    className={`w-full bg-[#282828] hover:bg-[#383838] text-white py-3 rounded-lg transition-colors cursor-pointer
                        ${listImageUrl && 'hover:bg-red-400'}`}
                >
                    {listImageUrl ? 'Remove photo' : 'Upload photo'}
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

    const listForm = (
        <div className="bg-[#181818] rounded-xl p-5 border border-gray-800/50 flex flex-col gap-4 w-4xl mx-auto">
            <header className='flex w-full h-full items-center gap-10'>
                {imageSection}

                <div className='flex flex-col justify-around gap-5 h-full w-full'>
                    <div className='flex flex-col'>
                        <input
                            placeholder="List Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className='text-4xl font-bold pb-1 w-md border-b border-white focus:border-[#1DB954] focus:outline-none transition-colors'
                        />
                        <label className={`text-red-500 text-sm mt-2 ${titleError ? 'visible' : 'invisible'}`}>Title is a required field.</label>
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm block mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="List Description"
                            className="w-lg bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition-colors resize-none min-h-30"
                        />
                    </div>
                </div>
            </header>

            <footer className="flex flex-col">
                <div className="flex items-center justify-end gap-3 mt-1">
                    <button
                        onClick={cancel}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        className="cursor-pointer flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                        <ListPlus className="w-4 h-4" />
                        {inserting ? 'Creating list...' : 'Create new list'}
                    </button>
                </div>

                <label className={`text-red-500 ml-auto mr-5 mt-2 text-xs ${error ? 'visible' : 'invisible'}`}>An error occurred when making the list.</label>
            </footer>
        </div>
    )

    return <>
        <h2
            className="ml-auto text-[#1DB954] hover:text-[#1ed760] transition-colors cursor-pointer"
            onClick={() => setActive((e) => !e)}
        >
            {
                active ?
                    'Cancel' :
                    'Create new list'
            }
        </h2>
        {active && listForm}
    </>
}