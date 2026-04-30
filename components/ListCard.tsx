'use client'

import { ListVideo } from "lucide-react"
import { ImageWithFallback } from "./img/ImageWithFallback"
import { useRouter } from "next/navigation"

type ListCardProps = {
    mode: 'REGULAR' | 'SMALL'
    cover_image_url?: string,
    id: number,
    user_id: string,
    username: string
    title: string,
    description?: string,
    created_at: string,
    updated_at?: string,
}

export default function ListCard({
    mode,
    id,
    cover_image_url,
    title,
    description,
    created_at,
    updated_at,
    user_id,
    username,
}: ListCardProps) {

    const router = useRouter();
    const createdTimeAgo = getTimeAgo(created_at);
    const updatedAtTimeAgo = updated_at && getTimeAgo(updated_at);

    const regularCard = (
        <div
            className='flex w-3xl min-h-50 bg-[#070707] hover:bg-[#181818] items-center 
            px-10 rounded-lg transition-colors cursor-pointer flex-row py-10'
            onClick={() => router.push(`/user/${username}/lists/${id}`)}
        >
            <div className="w-32 h-32 rounded-md overflow-hidden ring-2 ring-[#1DB954] p-0.5 group-hover:ring-[#9fddb5] transition-all shrink-0 flex justify-center items-center">
                {
                    cover_image_url ? (
                        <ImageWithFallback
                            src={cover_image_url}
                            alt={`list picture`}
                            className="w-full h-full rounded-md object-cover"
                        />
                    ) :
                        <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center">
                            <ListVideo className="w-16 h-16 text-gray-600" />
                        </div>
                }
            </div>

            <div className='flex flex-col h-full ml-10'>
                <h1 className='text-4xl w-sm wrap-break-words'>{title}</h1>
                <p className="text-gray-400 text-md whitespace-pre-wrap font-mono mt-2 w-sm wrap-break-words">
                    {description}
                </p>
            </div>

            <div className='flex h-full ml-auto mb-auto flex-col'>
                <p className="text-gray-500 text-sm ml-auto">Created {createdTimeAgo} ago</p>
                {updatedAtTimeAgo && (<p className="text-gray-500 text-xs italic">Updated {updatedAtTimeAgo} ago</p>)}
            </div>
        </div>
    )

    const smallCard = (
        <div>

        </div>
    )
    return (<>{(mode === 'REGULAR') ? regularCard : smallCard}</>)
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