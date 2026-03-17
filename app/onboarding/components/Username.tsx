
// all panels should determine whether or not to move onto next state, pass in step to change
import { validateUsernameSB } from "../queries";
import { useState, useEffect } from 'react';

type Props = {
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    arrowPress: number;
    setComponentState: React.Dispatch<React.SetStateAction<'inactive' | 'working' | 'failure' | 'success'>>;
}

export default function Username({ username, setUsername, arrowPress, setComponentState} : Props) {

    const [usernameError, setUsernameError] = useState('');
    
    const validateUsernameLocal = (u?: string): boolean => {
        const user = u || username;
        if (!user) {
            setUsernameError('Please enter a username.');
            return false;
        } else if (user.length < 2) {
            setUsernameError("Username is too short.");
            return false;
        } else if (!/^[\w.-]+$/.test(user)) {
            setUsernameError("Only letters, numbers, and special characters (., _, or -) allowed.")
            return false;
        } else if (user.length > 20) {
            setUsernameError("Username must be 20 characters or less");
            return false;
        } else {
            setUsernameError('');
            return true;
        }
    }

    useEffect(() => {
        if ( arrowPress === 0 ) return; // skip inital load
        
        let isMounted = true;

        const validate = async () => {
            setComponentState('working');
            const { errorMessage, result } = await validateUsernameSB(username);

            if (!result && isMounted) {
                setUsernameError(errorMessage);
                setComponentState('failure');
            } else {
                setComponentState('success');
            };
        }

        validate();

        return () => {
            isMounted = false;
        }
    }, [arrowPress])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-white mb-2">
                    Welcome to <span className="font-bold">Sound<span className="text-[#1DB954]">Circle</span></span>
                </h2>
                <p className="text-gray-400 text-lg mb-8">What should we call you?</p>

                <div className="mb-2">
                    <label className="text-white font-medium block mb-3">Username</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                validateUsernameLocal(e.target.value);
                            }}
                            onBlur={() => validateUsernameLocal()}
                            placeholder="yourhandle"
                            className="w-full bg-[#282828] text-white pl-10 pr-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                        />
                    </div>
                    {usernameError && (
                        <p className="text-red-500 text-sm mt-2">{usernameError}</p>
                    )}
                </div>
                <p className="text-gray-500 text-sm">This will be shown to other users — keep it short.</p>
            </div>
        </div>
    )
}