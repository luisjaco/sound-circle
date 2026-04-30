'use client'

import { useState } from "react"
import { CreateList } from "./CreateList"
import { ListVideo } from "lucide-react"
import ListCard from "@/components/ListCard"

type PageProps = {
    owner: boolean,
    username: string,
    lists: any
}

export default function Page({
    owner,
    username,
    lists
}: PageProps) {
    const [currentList, setCurrentLists] = useState(lists)

    return (
        <div>
            <header className='flex flex-col gap-2 px-20'>
                <h1 className="text-5xl font-bold pt-15 pb-3 border-b border-gray-800">
                    {owner ? 'My' : `${username}'s`} Lists
                </h1>
                {owner &&
                    <CreateList
                        setCurrentLists={setCurrentLists}
                    />
                }

            </header>

            {currentList.length === 0 ? (
                <div className="flex w-full h-full flex-col items-center justify-center mt-100">
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-2">
                        <ListVideo className="w-14 h-14 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-lg">No lists yet</p>
                </div>
            ) : (
                <div className='w-full h-full flex flex-col items-center pt-20 gap-10'>
                    {currentList.map((list: any, index: number) => {
                        return (<ListCard
                            key={index}
                            mode={'REGULAR'}
                            id={list.id}
                            title={list.title}
                            user_id={list.user_id}
                            username={username}
                            description={list.description}
                            cover_image_url={list.cover_image_url}
                            created_at={list.created_at}
                            updated_at={list.updated_at}
                        />
                        )
                    })
                    }
                </div>
            )}
        </div>
    )
}