'use client'

import { useState } from 'react';
import { Disc3, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { useEffect } from 'react';


export default function AuthPage() {
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [userTakenError, setUserTakenError] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setUserTakenError(false);

    /**
        The regular expression below cheks that a password:

        Has minimum 8 characters in length. Adjust it by modifying {8,}
        At least one uppercase English letter. You can remove this condition by removing (?=.*?[A-Z])
        At least one lowercase English letter.  You can remove this condition by removing (?=.*?[a-z])
        At least one digit. You can remove this condition by removing (?=.*?[0-9])
        At least one special character,  You can remove this condition by removing (?=.*?[#?!@$%^&*-])
     */
    const emailRegex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
    const passwordValid = ((emailRegex.test(email)) && (passwordRegex.test(password)));

    setPasswordError(!passwordValid);
    if (!passwordValid) return;

    const passwordMatch = (password === confirmPassword)
    setConfirmPasswordError(!passwordMatch);
    if (!passwordMatch || !supabase) return;

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    })

    if (error || !data.session) {
      error?.status === 422 ? setUserTakenError(true) : setError(true);
      return
    }

    // clear any spotify cookies from a previous account on the same browser
    await fetch('api/spotify/disconnect', { method: 'POST' });

    // move on
    setError(false);
    router.push('/onboarding');
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Disc3 className="w-12 h-12 text-[#1DB954]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Join SoundCircle
          </h1>
          <p className="text-gray-400">
            Create your account to start reviewing
          </p>
        </div>

        <div className="bg-[#181818] rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <label className='text-red-500 text-sm mt-2' hidden={!error} >Invalid email or password.</label>
            <label className='text-red-500 text-sm mt-2' hidden={!userTakenError} >This email is already being used.</label>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-[#282828] border-gray-700 text-white pl-10 py-6 rounded-lg focus:border-[#1DB954] focus:ring-[#1DB954]"
                />
              </div>
            </div>

            <label className='text-red-500 text-sm mt-2' hidden={!passwordError} >Invalid password.</label>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#282828] border-gray-700 text-white pl-10 py-6 rounded-lg focus:border-[#1DB954] focus:ring-[#1DB954]"
                />
              </div>
            </div>

            <label className='text-red-500 text-sm mt-2' hidden={!confirmPasswordError} >Passwords must match</label>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#282828] border-gray-700 text-white pl-10 py-6 rounded-lg focus:border-[#1DB954] focus:ring-[#1DB954]"
                />
              </div>
            </div>

            <p className="text-sm text-(--muted) mb-6">
              A valid password has:
              <br />- Minimum 8 characters in length.
              <br />- At least one uppercase English letter.
              <br />- At least one lowercase English letter.
              <br />- At least one digit.
              <br />- At least one special character.
            </p>
            <Button
              type="submit"
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white py-6 rounded-full font-medium text-lg transition-all hover:scale-105"
            >
              Sign Up
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            {"Already have an account? "}
            <button
              onClick={() => router.push('/login')}
              className="text-[#1DB954] hover:underline font-medium"
            >
              Login
            </button>
          </p>
        </div>


        <div className="bg-[#181818] rounded-lg p-4 mt-4">
          <p className="text-gray-400 text-xs text-center">
            You'll be able to connect your Spotify and Apple Music accounts after signing up to import your listening history.
          </p>
        </div>
      </div>
    </div>
  );
}