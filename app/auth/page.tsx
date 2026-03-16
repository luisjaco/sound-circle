'use client'

import { useState } from 'react';
import { Disc3, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onNavigate: (page: string) => void;
}

export default function AuthPage({ mode, onNavigate }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSignup = mode === 'signup';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to onboarding after signup, home after login
    if (isSignup) {
      onNavigate('onboarding');
    } else {
      onNavigate('home');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Disc3 className="w-12 h-12 text-[#1DB954]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignup ? 'Join SoundCircle' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400">
            {isSignup ? 'Create your account to start reviewing' : 'Log in to continue your music journey'}
          </p>
        </div>

        <div className="bg-[#181818] rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {!isSignup && (
              <div className="text-right">
                <button type="button" className="text-sm text-[#1DB954] hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white py-6 rounded-full font-medium text-lg transition-all hover:scale-105"
            >
              {isSignup ? 'Sign Up' : 'Log In'}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => onNavigate(isSignup ? 'login' : 'signup')}
              className="text-[#1DB954] hover:underline font-medium"
            >
              {isSignup ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {isSignup && (
          <div className="bg-[#181818] rounded-lg p-4 mt-4">
            <p className="text-gray-400 text-xs text-center">
              You'll be able to connect your Spotify and Apple Music accounts after signing up to import your listening history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

