"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Disc3, Loader2, Search } from 'lucide-react';
import Username from './components/Username';
import Informtion from './components/Information';
import ProfilePicture from './components/ProfilePicture';
import Genre from './components/Genre';
import Artist from './components/Artist';
import StreamingServices from './components/StreamingServices';
import Confirmation from './components/Confirmation';

interface OnboardingPageProps {
  onNavigate?: (page: string) => void;
}

type Genre = {
  id: number,
  genre: string
}

type Artist = {
  id: string,
  name: string
}

export default function OnboardingPage({ onNavigate }: OnboardingPageProps) {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // important for parent-child classes to communicate, when this is changed (arrow pressed), 
  // components will react. don't use boolean because if we keep a boolean at true, useEffect() won't
  // run on the child.
  const [arrowPress, setArrowPress] = useState(0);

  // current state of the child component in use. used for stalling the next/back arrows while queries
  // are being ran
  const [componentState, setComponentState] = useState<'inactive' | 'working' | 'failure' | 'success'>('inactive');

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [favoriteGenres, setFavoriteGenres] = useState<Genre[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);

  // disabled arrows when child is working, and move onto next component if child returns success
  useEffect(() => {
    if ((componentState === 'inactive') || (componentState === 'working')) return;

    if (componentState === 'success') {
      // move to user page if final step
      if (currentStep === totalSteps) {
        router.push(`/user/${username}`); 
        return;
      }

      setArrowPress(0);
      setCurrentStep((x) => x + 1);
    }

    // reset, even if failure
    setComponentState('inactive');
  }, [componentState])

  useEffect(() => {
    const step = searchParams.get('step');
    if (step) {
      setCurrentStep(Number(step));
    }
  }, [])

  const handleBack = () => {
    if (currentStep > 1) {
      setArrowPress(0)
      setCurrentStep(currentStep - 1);
      setComponentState('inactive');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Username
          username={username}
          setUsername={setUsername}
          arrowPress={arrowPress}
          setComponentState={setComponentState}
        />
      case 2:
        return <Informtion
          fullName={fullName}
          setFullName={setFullName}
          city={city}
          setCity={setCity}
          state={state}
          setState={setState}
          bio={bio}
          setBio={setBio}
          arrowPress={arrowPress}
          setComponentState={setComponentState}
        />
      case 3:
        return <ProfilePicture
          profilePictureUrl={profilePictureUrl}
          setProfilePictureUrl={setProfilePictureUrl}
          setProfilePictureFile={setProfilePictureFile}
          arrowPress={arrowPress}
          setComponentState={setComponentState}
        />
      case 4:
        return <Genre
          favoriteGenres={favoriteGenres}
          setFavoriteGenres={setFavoriteGenres}
          arrowPress={arrowPress}
          setComponentState={setComponentState}
        />
      case 5:
        return <Artist
          favoriteArtists={favoriteArtists}
          setFavoriteArtists={setFavoriteArtists}
          arrowPress={arrowPress}
          setComponentState={setComponentState}
        />
      case 6:
        return <StreamingServices
          arrowPress={arrowPress}
          setComponentState={setComponentState}
        />
      case 7:
        return <Confirmation
          profilePictureUrl={profilePictureUrl as string}
          profilePictureFile={profilePictureFile as File}
          fullName={fullName}
          bio={bio}
          username={username}
          city={city}
          state={state}
          favoriteGenres={favoriteGenres}
          favoriteArtists={favoriteArtists}
          arrowPress={arrowPress}
          setComponentState={setComponentState}
        />
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
            disabled={(currentStep === 1) || (componentState === 'working')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors 
              ${((currentStep === 1) || (componentState === 'working')) ?
                'bg-gray-800 text-gray-600 cursor-not-allowed'
                :
                'bg-[#282828] text-white hover:bg-[#383838]'
              }`
            }
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <button
            disabled={componentState === 'working'}
            onClick={() => setArrowPress((x) => x + 1)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors 
              ${componentState === 'working' ?
                'bg-gray-800 text-gray-600 cursor-not-allowed'
                :
                'bg-[#1DB954] hover:bg-[#1ed760] text-black`'
              }`
            }
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
