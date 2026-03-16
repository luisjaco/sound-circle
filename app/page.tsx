'use client'
import { Disc3 } from 'lucide-react';
import { Button } from '../components/ui/button';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border-2 border-[#1DB954]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full border-2 border-[#1DB954]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 width: 600px height: 600px rounded-full border border-[#1DB954]"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <Disc3 className="w-20 h-20 text-[#1DB954] animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
          Sound<span className="text-[#1DB954]">Circle</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-md mx-auto">
          Share your music journey. Review albums. Connect with listeners worldwide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => onNavigate('signup')}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-6 text-lg rounded-full font-medium transition-all hover:scale-105"
          >
            Sign Up
          </Button>
          <Button
            onClick={() => onNavigate('login')}
            variant="outline"
            className="border-2 border-[#1DB954] text-[#1DB954] hover:bg-[#1DB954] hover:text-white px-8 py-6 text-lg rounded-full font-medium transition-all"
          >
            Log In
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm mb-4">Preview the experience</p>
          <button
            onClick={() => onNavigate('home')}
            className="text-[#1DB954] hover:underline text-sm font-medium"
          >
            Explore Demo →
          </button>
        </div>
      </div>
    </div>
  );
}