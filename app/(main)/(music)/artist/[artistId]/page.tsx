'use client'

import { ArrowLeft, Music } from 'lucide-react';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtistPage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'albums' | 'singles'>('albums');
  const [loading, setLoading] = useState(true);

  const [artist, setArtist] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/artist/${artistId}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setArtist(data.artist);
        setAlbums(data.albums || []);
        setSongs(data.songs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [artistId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-15 pb-20 animate-pulse">
        
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <div className="w-48 h-48 rounded-full bg-[#181818] mx-auto mb-6" />
            <div className="h-10 bg-[#181818] rounded w-64 mx-auto mb-3" />
            <div className="flex gap-3 max-w-md mx-auto mt-6">
              <div className="flex-1 h-12 bg-[#181818] rounded-full" />
              <div className="flex-1 h-12 bg-[#181818] rounded-full" />
            </div>
          </div>
          <div className="flex gap-4 mb-6 border-b border-gray-800">
            <div className="h-8 w-20 bg-[#181818] mb-2 rounded" />
            <div className="h-8 w-20 bg-[#181818] mb-2 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="mb-4">
                <div className="w-full aspect-square rounded-lg bg-[#181818] mb-3" />
                <div className="h-5 bg-[#181818] rounded w-3/4 mb-1" />
                <div className="h-4 bg-[#181818] rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Artist not found</div>;
  }

  const currentList = activeTab === 'albums' ? albums : songs;

  return (
    <div className="min-h-screen bg-black pt-15 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Artist Header */}
        <div className="text-center mb-6">
          <ImageWithFallback
            src={artist.imageUrl || ''}
            alt={artist.name}
            className="w-48 h-48 rounded-full object-cover mx-auto mb-6 shadow-2xl"
          />
          <h2 className="text-4xl font-bold text-white mb-3">{artist.name}</h2>

          {/* Streaming Links */}
          <div className="flex gap-3 max-w-md mx-auto mt-6">
            {artist.spotify_id && (
              <a
                href={`https://open.spotify.com/artist/${artist.spotify_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-3 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <span className="font-medium">Spotify</span>
              </a>
            )}
            {artist.apple_music_id && (
              <a
                href={`https://music.apple.com/artist/${artist.apple_music_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#FA2D48] hover:bg-[#ff3d58] text-white px-4 py-3 rounded-full transition-colors"
              >
                <Music className="w-5 h-5" />
                <span className="font-medium">Apple Music</span>
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('albums')}
            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'albums'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Albums
            {activeTab === 'albums' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('singles')}
            className={`pb-3 px-1 font-medium transition-colors relative ${activeTab === 'singles'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
              }`}
          >
            Songs
            {activeTab === 'singles' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]" />
            )}
          </button>
        </div>

        {/* Albums/Singles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {currentList.map((item) => (
            <div
              key={item.id}
              className="text-left group cursor-pointer"
              onClick={() => router.push(`/${activeTab === 'albums' ? 'album' : 'song'}/${item.id}`)}
            >
              <div className="relative mb-3">
                <ImageWithFallback
                  src={item.imageUrl || ''}
                  alt={item.name}
                  className="w-full aspect-square rounded-lg object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                />
              </div>
              <h3 className="text-white font-medium mb-1 truncate group-hover:text-[#1DB954] transition-colors">
                {item.name}
              </h3>
              {item.releaseYear && (
                <p className="text-gray-400 text-sm">{item.releaseYear}</p>
              )}
            </div>
          ))}
          {currentList.length === 0 && (
            <p className="text-gray-500 col-span-2 sm:col-span-3 text-center py-10">
              No {activeTab} found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}