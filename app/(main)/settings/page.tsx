'use client';

import { useEffect, useRef, useState } from 'react';
import { validateUsernameSB, searchGenres } from '@/app/(auth)/onboarding/queries';
import { useMusicKit } from "@/components/providers/MusicKitProvider";
import { Loader2 } from 'lucide-react';

type Genre = {
  id: number;
  genre: string;
};

// settings page where users can update their profile info
export default function SettingsPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const [favoriteGenres, setFavoriteGenres] = useState<Genre[]>([]);
  const [genreQuery, setGenreQuery] = useState('');
  const [genreResults, setGenreResults] = useState<Genre[]>([]);
  const [genreWorking, setGenreWorking] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [genreError, setGenreError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const [loading, setLoading] = useState(true);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // load user settings on page load
  useEffect(() => {
    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();

            if (!res.ok) {
                console.error(data.error);
                setLoading(false);
                return;
            }

            setName(data.user.name ?? '');
            setUsername(data.user.username ?? '');
            setOriginalUsername(data.user.username ?? '');
            setBio(data.user.bio ?? '');
            setCity(data.user.city ?? '');
            setStateValue(data.user.state ?? '');
            setFavoriteGenres(data.favoriteGenres ?? []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load settings:', err);
            setLoading(false);
        }
    };
    loadSettings();
  }, []);
  
  // validate username locally with basic checks and regex
  const validateUsernameLocal = (u?: string): boolean => {
    const user = u ?? username;

    if (!user) {
      setUsernameError('Please enter a username.');
      return false;
    }
    if (user.length < 2) {
      setUsernameError('Username is too short.');
      return false;
    }
    if (!/^[\w.-]+$/.test(user)) {
      setUsernameError('Only letters, numbers, and ., _, - are allowed.');
      return false;
    }
    if (user.length > 20) {
      setUsernameError('Username must be 20 characters or less.');
      return false;
    }

    setUsernameError('');
    return true;
  };

  // validate username remotely by searching supabase for existing usernames
  const validateUsernameRemote = async () => {
    if (!validateUsernameLocal()) return false;

    if(username.trim() === originalUsername.trim()) {
        setUsernameError('');
        return true;
    }

    const { errorMessage, result } = await validateUsernameSB(username.trim());

    if (!result) {
      setUsernameError(errorMessage);
      return false;
    }

    setUsernameError('');
    return true;
  };

  // handlers for addings/removing favorite genres and searching for genres from the api
  const addGenre = (genre: Genre) => {
    if (!genre?.id) return;
    if (favoriteGenres.some((g) => g.id === genre.id)) return;
    if (favoriteGenres.length >= 3) return;

    setFavoriteGenres((prev) => [...prev, genre]);
    setGenreError('');
    setGenreQuery('');
    setGenreResults([]);
  };

  const removeGenre = (id: number) => {
    setFavoriteGenres((prev) => prev.filter((g) => g.id !== id));
  };

  const executeGenreSearch = async (query: string) => {
    const q = query.trim();

    if (!q || q.length < 2) {
      setGenreResults([]);
      setGenreWorking(false);
      return;
    }

    setGenreWorking(true);

    const { genres, result } = await searchGenres(q);

    if (!result) {
      setGenreError('There was an error searching for genres.');
      setGenreResults([]);
    } else {
      setGenreError('');
      setGenreResults(genres);
    }

    setGenreWorking(false);
  };

  // search for genres when the user types in the genre search box
  useEffect(() => {
    const q = genreQuery.trim();

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!q || q.length < 2) {
      setGenreResults([]);
      setGenreWorking(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeGenreSearch(q);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [genreQuery]);

  // handle form submission to update settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage('');

    if (!name.trim()) {
      setSubmitMessage('Name is required.');
      return;
    }

    const usernameOk = await validateUsernameRemote();
    if (!usernameOk) return;

    if (favoriteGenres.length === 0) {
      setGenreError('Select at least one genre.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('username', username);
    formData.append('favoriteGenres', JSON.stringify(favoriteGenres));
    formData.append('bio', bio);
    formData.append('city', city);
    formData.append('state', stateValue);
    if (profilePicture) formData.append('profilePicture', profilePicture);

    if (currentPassword || newPassword || confirmNewPassword) {
        const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordError('All password fields are required to change your password.');
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            setPasswordError('New password must be at least 8 characters and include an uppercase, lowercase, numbers, and special character.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        setPasswordError('');

        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
    }

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setSubmitMessage(data.error || 'Update failed.');
      return;
    }

    setSubmitMessage(data.message || 'Profile updated successfully.');
  };

  if (loading) return (
     <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-10">
        { /* settings form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
                <label className="block mb-1">Name</label>
                <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border px-3 py-2 w-full"
                />
            </div>

            <div>
            <label className="block mb-1">Username</label>
                <input
                value={username}
                onChange={(e) => {
                    setUsername(e.target.value);
                    validateUsernameLocal(e.target.value);
                }}
                onBlur={validateUsernameRemote}
                className="border px-3 py-2 w-full"
                />
                {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
            </div>

            <div>
                <label className="block mb-1">Bio</label>
                <input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="border px-3 py-2 w-full"
                />
            </div>

            <div>
                <label className="block mb-1">City</label>
                <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border px-3 py-2 w-full"
                />
            </div>

            <div>
                <label className="block mb-1">State</label>
                <input
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
                className="border px-3 py-2 w-full"
                />
            </div>

            <div>
                <label className="block mb-1">Profile Picture</label>
                <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files?.[0] ?? null)}
                />
            </div>

            <div>
                <label className="block mb-1">Search Genres</label>
                <input
                value={genreQuery}
                onChange={(e) => setGenreQuery(e.target.value)}
                className="border px-3 py-2 w-full"
                placeholder="Type a genre..."
                />

                {genreQuery.trim() !== '' && (
                <div className="border mt-2 max-h-48 overflow-y-auto">
                    {genreWorking ? (
                    <div className="p-2">Searching...</div>
                    ) : genreResults.length > 0 ? (
                    genreResults.map((genre) => (
                        <button
                        type="button"
                        key={genre.id}
                        className="block w-full text-left px-3 py-2 border-b"
                        onClick={() => addGenre(genre)}
                        >
                        {genre.genre}
                        </button>
                    ))
                    ) : (
                    <div className="p-2">No results found</div>
                    )}
                </div>
                )}

                <div className="mt-3 flex gap-2 flex-wrap">
                {favoriteGenres.map((genre) => (
                    <div key={genre.id} className="border px-3 py-1 flex items-center gap-2">
                    <span>{genre.genre}</span>
                    <button type="button" onClick={() => removeGenre(genre.id)}>
                        x
                    </button>
                    </div>
                ))}
                </div>

                {genreError && <p className="text-red-500 text-sm mt-1">{genreError}</p>}
            </div>

            <div>
                <label className="block mb-1">Current Password</label>
                <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border px-3 py-2 w-full"
                />
            </div>

            <div>
                <label className="block mb-1">New Password</label>
                <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border px-3 py-2 w-full"
                />
            </div>

            <div>
                <label className="block mb-1">Confirm New Password</label>
                <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="border px-3 py-2 w-full"
                />
            </div>

            {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )} 

        <button type="submit" className="border px-4 py-2">
            Update Settings
        </button>

        {submitMessage && <p className="mt-2">{submitMessage}</p>}
        </form>

        { /* streaming services */ }
        <StreamingServicesSection />
        
    </div>

  );
}

// component for connecting spotify and apple music accounts from settings page
function StreamingServicesSection() {
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [isAuthorizingApple, setIsAuthorizingApple] = useState(false);
    const { musicKit, isAuthorized } = useMusicKit();    
    const [appleConnectedMessage, setAppleConnectedMessage] = useState('');
    // check if spotify is already connected when component loads
    useEffect(() => {
        fetch('api/spotify/status')
            .then(res => res.json())
            .then(data => {
                if (data.connected) setSpotifyConnected(true);
            })
            .catch(() => {});
    }, []);

    // listen for the success message from the spotify popup after successful oauth
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
                setSpotifyConnected(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSpotifyConnect = () => {
        // open spotify oauth in a popup window
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        window.open(
            'api/spotify/auth',
            'spotify-auth',
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    const handleAppleMusicConnect = async () => {
        if (!musicKit) return;
        setIsAuthorizingApple(true);
        setAppleConnectedMessage('');
        try {
            if (!isAuthorized) {
                await musicKit.authorize();
            }
            setAppleConnectedMessage('Account connected successfully.');
        } catch (error) {
            console.error("Apple Music authorization failed", error);
            setAppleConnectedMessage('Failed to connect to Apple Music.');
        } finally {
            setIsAuthorizingApple(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Connected music services</h2>
     
            <button
                onClick={handleSpotifyConnect}
                disabled={spotifyConnected}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-full 
                    ${spotifyConnected
                        ? 'bg-[#1DB954] opacity-60 cursor-not-allowed' 
                        : 'bg-[#1DB954] hover:bg-[#1ed760]'
                    }`}
            >
                <img src="/brand/spotify.svg" className="w-6 h-6 scale-[10.6]" />
            </button>

            <button
                onClick={handleAppleMusicConnect}
                disabled={isAuthorizingApple || isAuthorized}
                className="w-full flex items-center justify-center bg-white hover:bg-gray-100 py-4 rounded-full" 
            >
                {isAuthorizingApple ? 'Connecting...' : (
                 <img src="/brand/apple-music.svg" className="w-6 h-6 scale-[6.6]" />
                )}
            </button>
            
            {appleConnectedMessage && (
                <p className="text-sm text-center">{appleConnectedMessage}</p>
            )}
        </div>
    )
}