"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, Disc3, Loader2 } from 'lucide-react';
import ArtistSearch from "@/components/ArtistSearch";

interface OnboardingPageProps {
  onNavigate?: (page: string) => void;
}

export default function OnboardingPage({ onNavigate }: OnboardingPageProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Step 1: Username
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // Step 2: About (Bio/Name)
  const [fullName, setFullName] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [bio, setBio] = useState('');

  // Step 3: Photo
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Step 4: Genres
  const genres = [
    'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Indie', 'Jazz',
    'Classical', 'Metal', 'R&B', 'Country', 'Reggae', 'Folk',
    'Punk', 'Soul', 'Blues'
  ];
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreError, setGenreError] = useState('');

  // Step 5: Artists
  const [artistPicks, setArtistPicks] = useState<{ id: string; name: string }[]>([]);
  const [artistError, setArtistError] = useState('');

  // Step 6: Services

  // ----------------------------------------------------
  // Step 1 Logic (Username checking from main)
  // ----------------------------------------------------
  function checkUsername(user = username) {
    if (!user) return "Please enter a username.";
    if (user.length < 2) return "Username is too short.";
    if (!/^[\w.-]+$/.test(user)) return "Only letters, numbers, and special characters (., _, or -) allowed.";
    if (user.length > 20) return "Username must be 20 characters or less";
    return null;
  }

  async function validateUsernameCheck() {
    if (!username) {
      setUsernameError('Please enter a username.');
      return false;
    }
    const formatError = checkUsername(username);
    if (formatError) {
      setUsernameError(formatError);
      return false;
    }

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

  // ----------------------------------------------------
  // Step 2 Logic (Full name validation from frontend-weekly)
  // ----------------------------------------------------
  const validateFullName = (value: string): boolean => {
    setFullNameError('');
    if (!value || value.trim() === '') {
      setFullNameError('Full name is required');
      return false;
    }
    return true;
  };

  // ----------------------------------------------------
  // Navigation
  // ----------------------------------------------------
  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await validateUsernameCheck();
      if (!isValid) return;
    }

    if (currentStep === 2) {
      if (!validateFullName(fullName)) return;
    }

    if (currentStep === 4) {
      setGenreError('');
      if (selectedGenres.length === 0) {
        setGenreError('Select at least one genre');
        return;
      }
    }

    if (currentStep === 5) {
      setArtistError('');
      if (artistPicks.length === 0) {
        setArtistError('Select at least one artist');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleting(true);
      router.push('/profile');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ----------------------------------------------------
  // More Handlers
  // ----------------------------------------------------
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      if (selectedGenres.length < 3) {
        setSelectedGenres([...selectedGenres, genre]);
      }
    }
  };

  function addArtist(artist: { id: string; name: string }) {
    if (!artist || !artist.id) return;
    if (artistPicks.some(a => a.id === artist.id) || artistPicks.length >= 3) return;
    setArtistPicks((p) => [...p, artist]);
    setArtistError('');
  }

  function removeArtist(id: string) {
    setArtistPicks((p) => p.filter((x) => x.id !== id));
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSkipPhoto = () => {
    setProfilePhoto(null);
    handleNext();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
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
                      if (usernameError) setUsernameError('');
                    }}
                    onBlur={() => validateUsernameCheck()}
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
        );

      case 2:
        return (
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
                    onBlur={() => validateFullName(fullName)}
                    placeholder="Your Name"
                    className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors"
                  />
                  {fullNameError && (
                    <p className="text-red-500 text-sm mt-2">{fullNameError}</p>
                  )}
                </div>

                <div>
                  <label className="text-white font-medium block mb-3">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Music enthusiast | Vinyl collector | Always discovering new sounds"
                    rows={3}
                    maxLength={150}
                    className="w-full bg-[#282828] text-white px-4 py-3 rounded-lg border-2 border-transparent focus:border-[#1DB954] outline-none transition-colors resize-none"
                  />
                  <p className="text-gray-500 text-xs mt-2">{bio.length}/150 characters</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-white mb-2">Profile photo</h2>
              <p className="text-gray-400 text-lg mb-8">Add a photo so people recognise you.</p>

              <div className="flex flex-col items-center gap-6">
                {profilePhoto ? (
                  <div className="relative">
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <button
                      onClick={() => setProfilePhoto(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors text-2xl leading-none"
                    >
                      ×
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
        );

      case 4:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-white mb-2">Pick up to 3 genres</h2>
              <p className="text-gray-400 text-lg mb-8">These help tailor your feed.</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`py-3 px-4 rounded-full text-sm font-medium transition-all ${selectedGenres.includes(genre)
                      ? 'bg-[#1DB954] text-white'
                      : 'bg-[#282828] text-white hover:bg-[#383838]'
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {genreError && (
                <p className="text-red-500 text-sm mt-2">{genreError}</p>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h2 className="text-white mb-2">Pick up to 3 artists</h2>
              <p className="text-gray-400 text-lg mb-8">Search for artists to follow (MusicBrainz later).</p>

              <div className="mb-6">
                <label className="text-gray-400 text-sm block mb-3">Search artists</label>
                <ArtistSearch onAddArtist={addArtist} />
              </div>

              <div className="space-y-3">
                {artistPicks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No artists chosen yet</p>
                ) : (
                  artistPicks.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center justify-between bg-[#282828] p-3 rounded-lg"
                    >
                      <span className="text-white">{artist.name}</span>
                      <button
                        onClick={() => removeArtist(artist.id)}
                        className="text-red-500 hover:text-red-400 text-xl"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {artistError && (
                <p className="text-red-500 text-sm mt-2">{artistError}</p>
              )}
            </div>
          </div>
        );

      case 6:
        return (
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
                  onClick={() => alert('TBD')}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black py-4 rounded-full font-medium transition-colors"
                >
                  <img
                    src="/brand/apple-music.svg"
                    alt="Apple Music"
                    className="w-6 h-6 shrink-0 scale-[6.6] object-contain"
                  />
                </button>
              </div>

              <p className="text-gray-500 text-sm text-center">
                You can connect later if you&apos;d prefer.
              </p>
            </div>
          </div>
        );

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
            disabled={isCompleting}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isCompleting
                ? 'bg-transparent border-2 border-[#1DB954]'
                : 'bg-[#1DB954] hover:bg-[#1ed760] text-black'
              }`}
          >
            {isCompleting ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#1DB954]" />
            ) : (
              <ArrowRight className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
