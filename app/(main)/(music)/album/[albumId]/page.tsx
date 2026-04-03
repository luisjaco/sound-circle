'use client'
import { ArrowLeft, ExternalLink, Music, ChevronDown } from 'lucide-react';
import { VinylRating } from '@/components/vinyl-rating';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import { useState } from 'react';


export default function AlbumPage() {
  const [expandedSongs, setExpandedSongs] = useState<number[]>([]);

  const toggleSong = (songId: number) => {
    setExpandedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const album = {
    title: 'OK Computer',
    artist: 'Radiohead',
    year: 1997,
    image: 'https://images.unsplash.com/photo-1765368763730-6d5d32125444?w=600',
    overallRating: 9.2,
    totalReviews: 1247,
    spotifyUrl: 'https://open.spotify.com/album/...',
    appleMusicUrl: 'https://music.apple.com/album/...'
  };

  const songs = [
    { id: 1, title: 'Airbag', duration: '4:44', rating: 8.9 },
    { id: 2, title: 'Paranoid Android', duration: '6:23', rating: 9.7 },
    { id: 3, title: 'Subterranean Homesick Alien', duration: '4:27', rating: 8.4 },
    { id: 4, title: 'Exit Music (For a Film)', duration: '4:24', rating: 9.3 },
    { id: 5, title: 'Let Down', duration: '4:59', rating: 9.1 },
    { id: 6, title: 'Karma Police', duration: '4:21', rating: 9.5 },
    { id: 7, title: 'Fitter Happier', duration: '1:57', rating: 7.2 },
    { id: 8, title: 'Electioneering', duration: '3:50', rating: 8.1 },
    { id: 9, title: 'Climbing Up the Walls', duration: '4:45', rating: 8.6 },
    { id: 10, title: 'No Surprises', duration: '3:48', rating: 9.4 },
    { id: 11, title: 'Lucky', duration: '4:19', rating: 8.8 },
    { id: 12, title: 'The Tourist', duration: '5:24', rating: 9.0 }
  ];

  const userReviews = [
    {
      id: 1,
      username: 'musiccritic_89',
      userImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      rating: 5,
      scoreOutOf10: 9.5,
      reviewText: 'A defining album of the 90s. Every track is meticulously crafted.',
      likes: 342,
      comments: 56,
      date: '2 days ago'
    },
    {
      id: 2,
      username: 'vinyl_enthusiast',
      userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      scoreOutOf10: 9.0,
      reviewText: 'Masterpiece. The production quality is incredible, especially on vinyl.',
      likes: 218,
      comments: 34,
      date: '5 days ago'
    },
    {
      id: 3,
      username: 'indie_lover',
      userImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
      rating: 4,
      scoreOutOf10: 8.5,
      reviewText: 'Brilliant album.',
      likes: 167,
      comments: 42,
      date: '1 week ago'
    }
  ];

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Album</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Album Header */}
        <div className="flex gap-6 mb-6">
          <ImageWithFallback
            src={album.image}
            alt={album.title}
            className="w-40 h-40 rounded-lg object-cover shadow-2xl flex-shrink:0"
          />
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white mb-2">{album.title}</h2>
            <button 
              className="text-gray-300 hover:text-white text-lg mb-2 text-left transition-colors"
            >
              {album.artist}
            </button>
            <p className="text-gray-400 text-sm mb-4">{album.year}</p>
            
            {/* Overall Rating */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-[#1DB954]">{album.overallRating}</span>
              <span className="text-gray-400 text-sm">/ 10</span>
            </div>
            <p className="text-gray-500 text-xs">{album.totalReviews.toLocaleString()} reviews</p>
          </div>
        </div>

        {/* Streaming Links */}
        <div className="flex gap-3 mb-6">
          <a
            href={album.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-3 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span className="font-medium">Open in Spotify</span>
          </a>
          <a
            href={album.appleMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#FA2D48] hover:bg-[#ff3d58] text-white px-4 py-3 rounded-full transition-colors"
          >
            <Music className="w-5 h-5" />
            <span className="font-medium">Apple Music</span>
          </a>
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
                  <span className="text-gray-500 text-sm w-6">{song.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{song.title}</p>
                    <p className="text-gray-400 text-sm">{song.duration}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[#1DB954] font-bold">{song.rating}</p>
                      <p className="text-gray-500 text-xs">/ 10</p>
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
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-[#282828] hover:bg-[#383838] text-white px-4 py-2 rounded-full transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Song Details
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">User Reviews</h3>
            <button
              className="text-[#1DB954] hover:text-[#1ed760] text-sm font-medium transition-colors"
            >
              Write a Review
            </button>
          </div>
          
          <div className="space-y-4">
            {userReviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <ImageWithFallback
                    src={review.userImage}
                    alt={review.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <button 
                        className="text-white font-medium hover:underline"
                      >
                        {review.username}
                      </button>
                      <span className="text-gray-500 text-xs">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <VinylRating rating={review.rating} size="sm" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-[#1DB954] font-bold text-lg">{review.scoreOutOf10}</span>
                        <span className="text-gray-500 text-xs">/ 10</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3">{review.reviewText}</p>
                <div className="flex gap-4 text-gray-500 text-xs">
                  <button className="hover:text-white transition-colors">
                    {review.likes} likes
                  </button>
                  <button 
                    className="hover:text-white transition-colors"
                  >
                    {review.comments} comments
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}