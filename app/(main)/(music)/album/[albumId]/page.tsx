'use client'
import { ArrowLeft, ExternalLink, Music, ChevronDown } from 'lucide-react';
import { VinylRating } from '@/components/vinyl-rating';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = use(params);
  const router = useRouter();
  const [expandedSongs, setExpandedSongs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumData, setAlbumData] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/album/${albumId}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setAlbumData(data.album);
        
        // Sort songs natively via spotify track numbering
        const sortedSongs = (data.songs || []).sort((a: any, b: any) => (a.trackNumber || 0) - (b.trackNumber || 0));
        setSongs(sortedSongs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [albumId]);

  const toggleSong = (songId: string) => {
    setExpandedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pb-20 animate-pulse">
        <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10 h-14" />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex gap-6 mb-6">
            <div className="w-40 h-40 rounded-lg bg-[#181818] flex-shrink-0" />
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-8 bg-[#181818] rounded w-3/4 mb-4" />
              <div className="h-5 bg-[#181818] rounded w-1/2 mb-2" />
              <div className="h-4 bg-[#181818] rounded w-1/4 mb-6" />
              <div className="h-10 bg-[#181818] rounded w-20" />
            </div>
          </div>
          <div className="flex gap-3 mb-6">
            <div className="flex-1 h-12 bg-[#181818] rounded-full" />
            <div className="flex-1 h-12 bg-[#181818] rounded-full" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-[#181818] rounded-lg w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!albumData) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Album not found</div>;
  }

  return (
    <div className="min-h-screen bg-black pb-20 pt-15">

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Album Header */}
        <div className="flex gap-6 mb-6">
          <ImageWithFallback
            src={albumData.imageUrl || ''}
            alt={albumData.name}
            className="w-40 h-40 rounded-lg object-cover shadow-2xl flex-shrink-0"
          />
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white mb-2">{albumData.name}</h2>
            <button 
              onClick={() => router.push(`/artist/${albumData.artist_id}`)}
              className="text-gray-300 hover:text-white text-lg mb-2 text-left transition-colors"
            >
              {albumData.artists?.name}
            </button>
            <p className="text-gray-400 text-sm mb-4">
               {albumData.releaseYear || 'Album'}
            </p>
            
            {/* Overall Rating (Simulated mapped via Spotify Popularity indices scaled /10) */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-[#1DB954]">
                 {albumData.popularity !== undefined ? (albumData.popularity / 10).toFixed(1) : '--'}
              </span>
              <span className="text-gray-400 text-sm">/ 10</span>
            </div>
            <p className="text-gray-500 text-xs">Simulated from Global Streams</p>
          </div>
        </div>

        {/* Streaming Links */}
        <div className="flex gap-3 mb-6">
          {albumData.spotify_id && (
            <a
              href={`https://open.spotify.com/album/${albumData.spotify_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-3 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span className="font-medium">Spotify</span>
            </a>
          )}
          {albumData.apple_music_id && (
            <a
              href={`https://music.apple.com/album/${albumData.apple_music_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#FA2D48] hover:bg-[#ff3d58] text-white px-4 py-3 rounded-full transition-colors"
            >
              <Music className="w-5 h-5" />
              <span className="font-medium">Apple Music</span>
            </a>
          )}
        </div>

        {/* Songs List */}
        <div className="mb-8">
          <h3 className="text-white font-bold mb-4">Tracks</h3>
          <div className="space-y-1">
            {songs.map((song) => (
              <div key={song.id} className="bg-[#181818] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSong(song.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-[#282828] transition-colors text-left"
                >
                  <span className="text-gray-500 text-sm w-6">{song.trackNumber || '-'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{song.name}</p>
                    <p className="text-gray-400 text-sm">{song.duration || '--:--'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-3">
                      <p className="text-[#1DB954] font-bold text-lg">
                        {song.popularity !== undefined ? (song.popularity / 10).toFixed(1) : '--'}
                      </p>
                      <p className="text-gray-500 text-[10px]">/ 10</p>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedSongs.includes(song.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                
                {expandedSongs.includes(song.id) && (
                  <div className="px-4 pb-4 border-t border-gray-700">
                    <button
                      onClick={() => router.push(`/song/${song.id}`)}
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-[#282828] hover:bg-[#383838] text-white px-4 py-2 rounded-full transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Song Details
                    </button>
                  </div>
                )}
              </div>
            ))}
            {songs.length === 0 && (
              <p className="text-gray-500 text-center py-8">No tracks matched for this release</p>
            )}
          </div>
        </div>

        {/* User Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">User Reviews</h3>
            <button className="text-[#1DB954] hover:text-[#1ed760] text-sm font-medium transition-colors">
              Write a Review
            </button>
          </div>
          
          <div className="space-y-4">
             <p className="text-gray-500 text-center py-8">No reviews yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}