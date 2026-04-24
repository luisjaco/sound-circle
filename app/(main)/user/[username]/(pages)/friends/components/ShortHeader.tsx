'use client'

import ProfilePicture from "@/components/img/ProfilePicture"

type ShortHeaderProps = {
    profile: {
        username: string,
        name: string,
        profilePicture: string,
        city: string,
        state: string,
        bio: string,
    }
}

export default function ShortHeader({
    profile: {
        username,
        name,
        profilePicture,
        city,
        state,
        bio,
    } }: ShortHeaderProps
) {
        const profileHeader = (
        <div className="flex items-start gap-20 mb-6 overflow-hidden">
            <div className='flex flex-full flex-col relative'>
                <ProfilePicture
                    src={profilePicture}
                    size={62}
                />
            </div>

            <div className="flex-1">
                <h2 className="text-5xl font-bold text-white">
                    {username}
                </h2>
                <p className="text-gray-400 text-2xl italic">
                    {`${name
                        } ${(city || state) && '  •  '
                        }${city ? city : ''
                        }${((city && state) ? ', ' : "")
                        }${state ? state : ""
                        }`}
                </p>
                <p className="text-gray-400 mt-3 text-lg whitespace-pre font-mono">
                    {bio}
                </p>
            </div>
        </div>
    )

    return (<>
        {profileHeader}
    </>)
}