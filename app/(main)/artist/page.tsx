'use client'
import { ArrowLeft, ExternalLink, Music } from 'lucide-react';
import { ImageWithFallback } from '@/components/img/ImageWithFallback';
import { useState } from 'react';


export default function ArtistPage() {
  const [activeTab, setActiveTab] = useState<'albums' | 'singles'>('albums');

  const artist = {
    name: 'MFDOOM',
    image: 'https://images.unsplash.com/photo-1614247912229-26a7e2114c0a?w=600',
    bio: 'bio here',
    followers: '8.2M',
    spotifyUrl: 'https://open.spotify.com/artist/...',
    appleMusicUrl: 'https://music.apple.com/artist/...',
    genres: ['Hip Hop', 'Rap', 'Jazz']
  };

  const albums = [
    {
      id: 1,
      title: 'Operation: Doomsday',
      year: 1999,
      image: 'https://images.unsplash.com/photo-1765368763730-6d5d32125444?w=400',
      rating: 9.2,
      reviews: 1247
    },
    {
      id: 2,
      title: 'Mm..Food',
      year: 2004,
      image: 'https://images.unsplash.com/photo-1616663395403-2e0052b8e595?w=400',
      rating: 9.4,
      reviews: 1156
    },
    {
      id: 3,
      title: 'Take Me to Your Leader',
      year: 2003,
      image: 'https://images.unsplash.com/photo-1703115015343-81b498a8c080?w=400',
      rating: 9.3,
      reviews: 982
    },
    {
      id: 4,
      title: 'Madvillainy',
      year: 2004,
      image: 'https://images.unsplash.com/photo-1632491785983-57fe3ebf0395?w=400',
      rating: 8.9,
      reviews: 876
    },
    {
      id: 5,
      title: 'Vaudeville Villain',
      year: 2003,
      image: 'https://images.unsplash.com/photo-1681148773098-1460911e25a4?w=400',
      rating: 8.7,
      reviews: 654
    },
    {
      id: 6,
      title: 'Born Like This',
      year: 2009,
      image: 'https://images.unsplash.com/photo-1761814684971-fa0e7fd606e2?w=400',
      rating: 8.5,
      reviews: 743
    }
  ];

  const singles = [
    {
      id: 1,
      title: 'All Caps',
      year: 2004,
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      rating: 8.8,
      reviews: 543
    },
    {
      id: 2,
      title: 'Bomb Thrown',
      year: 2018,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      rating: 9.5,
      reviews: 621
    },
    {
      id: 3,
      title: 'Break in the Action',
      year: 2021,
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
      rating: 9.1,
      reviews: 489
    },
    {
      id: 4,
      title: 'One Beer',
      year: 2004,
      image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400',
      rating: 9.3,
      reviews: 412
    }
  ];

  const currentList = activeTab === 'albums' ? albums : singles;

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
          <h1 className="text-xl font-bold text-white">Artist</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Artist Header */}
        <div className="text-center mb-6">
          <ImageWithFallback
            src={artist.image}
            alt={artist.name}
            className="w-48 h-48 rounded-full object-cover mx-auto mb-6 shadow-2xl"
          />
          <h2 className="text-4xl font-bold text-white mb-3">{artist.name}</h2>
          <p className="text-gray-400 text-sm mb-4 max-w-xl mx-auto">{artist.bio}</p>
          
          {/* Genres */}
          <div className="flex gap-2 justify-center mb-4">
            {artist.genres.map((genre, index) => (
              <span
                key={index}
                className="bg-[#181818] text-gray-300 px-3 py-1 rounded-full text-xs"
              >
                {genre}
              </span>
            ))}
          </div>

          <p className="text-gray-500 text-sm mb-6">{artist.followers} followers</p>

          {/* Streaming Links */}
          <div className="flex gap-3 max-w-md mx-auto">
            <a
              href={artist.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-3 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span className="font-medium">Spotify</span>
            </a>
            <a
              href={artist.appleMusicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#FA2D48] hover:bg-[#ff3d58] text-white px-4 py-3 rounded-full transition-colors"
            >
              <Music className="w-5 h-5" />
              <span className="font-medium">Apple Music</span>
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('albums')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'albums'
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
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'singles'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Singles
            {activeTab === 'singles' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]" />
            )}
          </button>
        </div>

        {/* Albums/Singles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {currentList.map((item) => (
            <button
              key={item.id}
              className="text-left group"
            >
              <div className="relative mb-3">
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="w-full aspect-square rounded-lg object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#1DB954] font-bold text-sm">{item.rating}</span>
                    <span className="text-gray-400 text-xs">/10</span>
                  </div>
                </div>
              </div>
              <h3 className="text-white font-medium mb-1 truncate group-hover:text-[#1DB954] transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm mb-1">{item.year}</p>
              <p className="text-gray-500 text-xs">
                {item.reviews.toLocaleString()} reviews
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}