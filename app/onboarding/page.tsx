"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, Disc3, Loader2 } from 'lucide-react';
import ArtistSearch from "@/components/ArtistSearch";
import GenreSearch from '@/components/GenreSearch';
import { createClient } from '@/lib/supabase/browser';
import { useMusicKit } from "@/components/providers/MusicKitProvider";

interface OnboardingPageProps {
  onNavigate?: (page: string) => void;
}

export default function OnboardingPage({ onNavigate }: OnboardingPageProps) {

  const router = useRouter();
  const { musicKit, isAuthorized } = useMusicKit();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const [appleConnectedMessage, setAppleConnectedMessage] = useState('');
  const [isAuthorizingApple, setIsAuthorizingApple] = useState(false);

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [fullName, setFullName] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [genrePicks, setGenrePicks] = useState<{ id: number; genre: string }[]>([]);
  const [genreError, setGenreError] = useState('');

  const [artistPicks, setArtistPicks] = useState<{ id: string; name: string }[]>([]);
  const [artistError, setArtistError] = useState('');

  const supabase = createClient();
  const [submissionError, setSubmissionError] = useState(false);

  const validateUsername = (u?: string): boolean => {
    const user = u || username;
    // local check
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

  const validateOriginalUsername = async (): Promise<boolean> => {
    // supabase check for username originality (does username exist in table?)
    try {
      const res = await fetch(`/api/supabase/users?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        setUsernameError('There was an error validating this username.');
        return false;
      }
      const data = await res.json();
      if (data.length > 0) {
        setUsernameError('This username already exists.');
        return false;
      }
      setUsernameError('');
      return true;
    } catch {
      setUsernameError('There was an error validating this username.');
      return false;
    }
  }

  const validateFullName = (): boolean => {
    if (!fullName || fullName.trim() === '') {
      setFullNameError('Full name is required');
      return false;
    } else {
      setFullNameError('');
      return true;
    }
  };

  const validateGenreSelection = (): boolean => {
    if (genrePicks.length === 0) {
      setGenreError('Select at least one genre');
      return false;
    }
    else {
      setGenreError('');
      return true;
    }
  }

  const validateArtistSelection = (): boolean => {

    if (artistPicks.length === 0) {
      setArtistError('Select at least one artist');
      return false;
    } else {
      setArtistError('');
      return true;
    }
  }

  const handleNext = async () => {
    switch (currentStep) {
      case 1: {
        if (!(validateUsername()) || !(await validateOriginalUsername())) return;
        break;
      }
      case 2: {
        if (!validateFullName()) return;
        break;
      }
      case 3: {
        break;
      }
      case 4: {
        if (!validateGenreSelection()) return;
        break;
      }
      case 5: {
        if (!validateArtistSelection()) return;
        break;
      }
      case 6: {
        break;
      }
      case 7: {
        if (!(await handleSubmit())) {
          return;
        } else {
          router.push('/test-review');
        }
      }
      default: {
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async () => {
    // while attempting
    setSubmissionError(false);
    
    const session = await fetch('/api/auth/session');
    const sessionData = await session.json();

    if ( !session.ok ) {
      setSubmissionError(true);
      return false;
    }

    const uuid = sessionData.user.id;

    // profile image
    let imagePath = '';
    if ( profilePictureUrl && profilePictureFile) {
      const [originalName, fileExt] = profilePictureUrl.split('.')
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `${uuid}/${fileName}`;

      const { error } = await supabase
        .storage
        .from('profile_images')
        .upload(filePath, profilePictureFile);

      if ( error ) {
        setSubmissionError(true);
        return false;
      } else {
        const { publicUrl } = await supabase
          .storage
          .from('profile_images')
          .getPublicUrl(filePath)
          .data;

        if ( publicUrl ) {
          imagePath = publicUrl;
          setSubmissionError(false);
        }
        else {
          setSubmissionError(true);
          return false;
        }
      }
    }

    // user data
    const { data, error } = await supabase
      .from('users')
      .insert({
        'id' : uuid,
        'name' : fullName,
        'bio' : bio,
        'username' : username,
        'city' : city,
        'state' : state,
        'profile_picture_url' : imagePath,
      })
    
    if ( error ) {
      console.log('users error', error);
      setSubmissionError(true);
      return false;
    }

    // user_favorite_genres insert
    const favoriteGenres = genrePicks.map((x) => ({user_id: uuid, genre_id: x.id}));
    const favoriteGenreQuery = supabase
      .from('user_favorite_genres')
      .insert(favoriteGenres);
      
    /** @TODO currently, skip adding artists. */
    // const favoriteArtists = artistPicks.map((x) => ({user_id: uuid, artist_id: x.id}));
    // const favoriteArtistQuery = supabase
    //   .from('user_favorite_artists')
    //   .insert(favoriteArtists);

    const queries = [favoriteGenreQuery] //, favoriteArtistQuery];

    const [genres] = await Promise.all(queries);

    if ( genres.error ) { //|| artists.error ) {
      if (genres.error) console.log("user_favorite_genres error", genres.error);
      // if (artists.error) console.log("user_favorite_artists error", artists.error);
      setSubmissionError(true);
      return false;
    } else {
      return true;
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  function addGenre(genre: { id: number; genre: string }) {
    if (!genre || !genre.id) return;
    if (genrePicks.some(a => a.id === genre.id) || genrePicks.length >= 3) return;
    setGenrePicks((p) => [...p, genre]);
    setGenreError('');
  }

  function addArtist(artist: { id: string; name: string }) {
    if (!artist || !artist.id) return;
    if (artistPicks.some(a => a.id === artist.id) || artistPicks.length >= 3) return;
    setArtistPicks((p) => [...p, artist]);
    setArtistError('');
  }

  function removeGenre(id: number) {
    setGenrePicks((p) => p.filter((x) => x.id !== id))
  }

  function removeArtist(id: string) {
    setArtistPicks((p) => p.filter((x) => x.id !== id));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setProfilePictureUrl(imageUrl);
    setProfilePictureFile(file);
  };

  const handleRemovePhoto = () => {
    setProfilePictureUrl(null);
    setProfilePictureFile(null)
  }

  const handleSkipPhoto = () => {
    setProfilePictureUrl(null);
    setProfilePictureFile(null);
    handleNext();
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

  const usernamePanel = (
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
                validateUsername(e.target.value);
              }}
              onBlur={() => validateUsername()}
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

  const bioPanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-white mb-2">Tell us about yourself</h2>
        <p className="text-gray-400 text-lg mb-8">Help others get to know you.</p>

        <div className="space-y-4">
          <div>
            <label className="text-white font-medium block mb-3">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fullNameError) setFullNameError('');
              }}
              onBlur={() => validateFullName()}
              placeholder="Your Name"
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
            />
            {fullNameError && (
              <p className="text-red-500 text-sm mt-2">{fullNameError}</p>
            )}
          </div>

          <div>
            <label className="text-white font-medium block mb-3">State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="NY"
              maxLength={2}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-white font-medium block mb-3">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Old Westbury"
              maxLength={50}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-white font-medium block mb-3">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Always discovering new sounds!"
              rows={3}
              maxLength={150}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors resize-none"
            />
            <p className="text-gray-500 text-xs mt-2">{bio.length}/150 characters</p>
          </div>
        </div>
      </div>
    </div>
  )

  const profilePicturePanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-white mb-2">Profile photo</h2>
        <p className="text-gray-400 text-lg mb-8">Add a photo so people recognise you.</p>

        <div className="flex flex-col items-center gap-6">
          {profilePictureUrl ? (
            <div className="relative">
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors text-2xl leading-none"
              >
                x
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#282828] flex items-center justify-center">
              <User className="w-16 h-16 text-gray-600" />
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleSkipPhoto}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors"
            >
              No photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#282828] hover:bg-[#383838] text-white py-3 rounded-lg transition-colors"
            >
              Upload photo
            </button>
            <p className="text-gray-500 text-xs text-center">
              JPG, PNG — up to 5MB. You can change this later.
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
      </div>
    </div>
  )

  const genrePanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-white mb-2">Pick up to 3 genres</h2>
        <p className="text-gray-400 text-lg mb-8">These help tailor your feed.</p>

        <div className="mb-6">
          <label className="text-gray-400 text-sm block mb-3">Search genres</label>
          <GenreSearch onAddGenre={addGenre} />
        </div>

        <div className="space-y-3">
          {genrePicks.length === 0 ? (
            <p className="text-gray-500 text-sm">No genres chosen yet</p>
          ) : (
            <div className='inline-flex'>
              {
                genrePicks.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mx-1.5"
                  >
                    <span className="text-white">{genre.genre}</span>
                    <button
                      onClick={() => removeGenre(genre.id)}
                      className="text-red-500 hover:text-red-400 text-xl ml-1"
                    >
                      x
                    </button>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {genreError && (
          <p className="text-red-500 text-sm mt-2">{genreError}</p>
        )}
      </div>
    </div>
  )

  const artistPanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-white mb-2">Pick up to 3 artists</h2>
        <p className="text-gray-400 text-lg mb-8">Search for artists to follow.</p>

        <div className="mb-6">
          <label className="text-gray-400 text-sm block mb-3">Search artists</label>
          <ArtistSearch onAddArtist={addArtist} />
        </div>

        <div className="space-y-3">
          {artistPicks.length === 0 ? (
            <p className="text-gray-500 text-sm">No artists chosen yet</p>
          ) : (
            <div className='inline-flex'>
              {
                artistPicks.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mx-1.5"
                  >
                    <span className="text-white">{artist.name}</span>
                    <button
                      onClick={() => removeArtist(artist.id)}
                      className="text-red-500 hover:text-red-400 text-xl ml-1"
                    >
                      x
                    </button>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {artistError && (
          <p className="text-red-500 text-sm mt-2">{artistError}</p>
        )}
      </div>
    </div>
  )

  const streamingServicePanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-white mb-2">Connect music services</h2>
        <p className="text-gray-400 text-lg mb-8">
          Optionally connect Spotify or Apple Music to import your listening history.
        </p>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => router.push('/library')}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-full font-medium transition-colors bg-[#1DB954] hover:bg-[#1ed760] text-black"
                >
                  <img
                    src="/brand/spotify.svg"
                    alt="Spotify"
                    className="w-6 h-6 shrink-0 scale-[10.6] object-contain"
                  />
                </button>
                <button
                  onClick={handleAppleMusicConnect}
                  disabled={isAuthorizingApple || isAuthorized}
                  className={`w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black py-4 rounded-full font-medium transition-colors ${isAuthorized ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isAuthorizingApple ? (
                    <Loader2 className="w-6 h-6 animate-spin text-black" />
                  ) : (
                    <img
                      src="/brand/apple-music.svg"
                      alt="Apple Music"
                      className="w-6 h-6 shrink-0 scale-[6.6] object-contain"
                    />
                  )}
                </button>
              </div>

              {appleConnectedMessage && (
                <p className={`text-sm text-center mb-6 font-medium ${appleConnectedMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                  {appleConnectedMessage}
                </p>
              )}

        <p className="text-gray-500 text-sm text-center">
          You can connect later if you&apos;d prefer.
        </p>
      </div>
    </div>
  )

  const confirmationPanel = (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-white mb-2">Confirm your information</h2>
        <p className="text-gray-400 text-lg mb-3">Final check before becoming a SoundCircle user!</p>

        {submissionError && (
            <p className="text-red-500 text-sm mt-2">There was an error creating your profile.</p>
        )}

        <div className="flex flex-col items-center gap-6 mb-3">
          {profilePictureUrl ? (
            <div className="relative">
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#282828] flex items-center justify-center">
              <User className="w-16 h-16 text-gray-600" />
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="mb-3">
            <label className="text-white font-medium block mb-3">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">@</span>
              <input
                type="text"
                value={username}
                disabled={true}
                className="w-full bg-[#282828] text-white pl-10 pr-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-white font-medium block mb-3">Full name</label>
            <input
              type="text"
              value={fullName}
              disabled={true}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
            />
            {fullNameError && (
              <p className="text-red-500 text-sm mt-2">{fullNameError}</p>
            )}
          </div>
          <div>
            <label className="text-white font-medium block mb-3">State</label>
            <input
              value={state}
              disabled={true}
              maxLength={2}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-white font-medium block mb-3">City</label>
            <input
              value={city}
              disabled={true}
              maxLength={50}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-white font-medium block mb-3">Bio</label>
            <textarea
              value={bio}
              disabled={true}
              className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-white font-medium block mb-3">Favorite Genres</label>
            <div className="inline-flex">
              {
                genrePicks.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mx-1.5"
                  >
                    <span className="text-white">{genre.genre}</span>
                  </div>
                ))}
            </div>

          </div>
          <div>
            <label className="text-white font-medium block mb-3">Favorite Artists</label>
            <div className='inline-flex'>
              {
                artistPicks.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between bg-[#282828] p-3 rounded-lg mb-3 mx-1.5"
                  >
                    <span className="text-white">{artist.name}</span>
                  </div>
                ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return usernamePanel
      case 2:
        return bioPanel
      case 3:
        return profilePicturePanel
      case 4:
        return genrePanel
      case 5:
        return artistPanel
      case 6:
        return streamingServicePanel
      case 7:
        return confirmationPanel
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-3xl p-8 md:p-12 min-height:600px flex flex-col">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Disc3 className="w-20 h-20 text-[#1DB954] animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <p className="text-gray-400 text-sm">Step {currentStep}/{totalSteps}</p>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-8">
          Complete your profile
        </h1>

        <div className="flex-1 mb-8">
          {renderStepContent()}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${currentStep === 1
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-[#282828] text-white hover:bg-[#383838]'
              }`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className={'w-14 h-14 rounded-full flex items-center justify-center transition-colors bg-[#1DB954] hover:bg-[#1ed760] text-black'}
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
