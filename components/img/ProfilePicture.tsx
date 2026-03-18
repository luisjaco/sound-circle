import { ImageWithFallback } from "./ImageWithFallback"
import { User } from 'lucide-react';

type Props = {
    size: number;
    src?: string;
}

// either profile picture or default picture
export default function ProfilePicture({
    size,
    src
}: Props
) {

    const trueSize = size * 4;

    return (
        <>
            {
                src ?
                    (
                        <ImageWithFallback
                            src={src}
                            style={{ width: trueSize, height: trueSize}}
                            alt="Profile"
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div 
                            className="rounded-full bg-[#282828] flex items-center justify-center"
                            style={{ width: trueSize, height: trueSize}}
                            >
                            <User 
                                className="text-gray-600"
                                style={{ width: trueSize, height: trueSize}}
                            />
                        </div>
                    )
            }
        </>
    )
}