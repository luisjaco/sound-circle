'use client'
import { useState } from 'react';
import { Shield, AlertTriangle, Trash2, Edit3, Ban, Flag, X, Check } from 'lucide-react';

interface ModeratorPageProps {
  onNavigate: (page: string) => void;
}

interface FlaggedPost {
  id: number;
  postType: 'review' | 'comment';
  albumTitle?: string;
  artistName?: string;
  content: string;
  username: string;
  userAvatar: string;
  flagReason: string;
  flagCount: number;
  timestamp: string;
}

interface UserReport {
  userId: number;
  username: string;
  userAvatar: string;
  email: string;
  flagCount: number;
  accountStatus: 'active' | 'warned' | 'banned';
  recentFlags: string[];
}

export default function ModeratorPage({ onNavigate }: ModeratorPageProps) {
  const [activeTab, setActiveTab] = useState<'flagged' | 'users'>('flagged');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([
    {
      id: 1,
      postType: 'review',
      albumTitle: 'album',
      artistName: 'artist',
      content: 'test',
      username: 'angrylistener',
      userAvatar: 'https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200',
      flagReason: 'Offensive language / Personal attacks',
      flagCount: 12,
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      postType: 'comment',
      content: 'test',
      username: 'spambot2000',
      userAvatar: 'https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200',
      flagReason: 'Spam / Self-promotion',
      flagCount: 24,
      timestamp: '5 hours ago'
    },
    {
      id: 3,
      postType: 'review',
      albumTitle: 'album test',
      artistName: 'artist',
      content: 'Terrible album made by terrible people. I hope they fail and lose everything.',
      username: 'hater123',
      userAvatar: 'https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200',
      flagReason: 'Harassment / Hate speech',
      flagCount: 18,
      timestamp: '1 day ago'
    },
    {
      id: 4,
      postType: 'review',
      albumTitle: 'test',
      artistName: 'test',
      content: 'test',
      username: 'faircritic',
      userAvatar: 'https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200',
      flagReason: 'False report (review is appropriate)',
      flagCount: 1,
      timestamp: '2 days ago'
    }
  ]);

  const [userReports, setUserReports] = useState<UserReport[]>([
    {
      userId: 1,
      username: 'angrylistener',
      userAvatar: 'https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200',
      email: 'angry@example.com',
      flagCount: 15,
      accountStatus: 'active',
      recentFlags: ['Offensive language', 'Personal attacks', 'Harassment']
    },
    {
      userId: 2,
      username: 'spambot2000',
      userAvatar: 'https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200',
      email: 'spam@example.com',
      flagCount: 32,
      accountStatus: 'warned',
      recentFlags: ['Spam', 'Self-promotion', 'Multiple violations']
    },
    {
      userId: 3,
      username: 'hater123',
      userAvatar: 'https://images.unsplash.com/photo-1557511113-84fb922d34d5?w=200',
      email: 'hater@example.com',
      flagCount: 27,
      accountStatus: 'active',
      recentFlags: ['Harassment', 'Hate speech', 'Offensive language']
    }
  ]);

  const handleDeletePost = (postId: number) => {
    setFlaggedPosts(flaggedPosts.filter(post => post.id !== postId));
  };

  const handleEditPost = (postId: number, content: string) => {
    setEditingPostId(postId);
    setEditedContent(content);
  };

  const handleSaveEdit = (postId: number) => {
    setFlaggedPosts(flaggedPosts.map(post =>
      post.id === postId ? { ...post, content: editedContent } : post
    ));
    setEditingPostId(null);
    setEditedContent('');
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedContent('');
  };

  const handleDismissFlag = (postId: number) => {
    setFlaggedPosts(flaggedPosts.filter(post => post.id !== postId));
  };

  const handleWarnUser = (userId: number) => {
    setUserReports(userReports.map(user =>
      user.userId === userId ? { ...user, accountStatus: 'warned' as const } : user
    ));
  };

  const handleBanUser = (userId: number) => {
    setUserReports(userReports.map(user =>
      user.userId === userId ? { ...user, accountStatus: 'banned' as const } : user
    ));
  };

  const handleUnbanUser = (userId: number) => {
    setUserReports(userReports.map(user =>
      user.userId === userId ? { ...user, accountStatus: 'active' as const } : user
    ));
  };

  return (
    <div className="min-h-screen bg-black pb-6">
      {/* Header */}
      <header>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#1DB954]" />
            <h1 className="text-2xl font-bold text-white">
              Moderator Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('flagged')}
            className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === 'flagged' ? 'text-[#1DB954]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" />
            Flagged Posts ({flaggedPosts.length})
            {activeTab === 'flagged' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === 'users' ? 'text-[#1DB954]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            User Reports ({userReports.length})
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1DB954]"></div>
            )}
          </button>
        </div>

        {/* Flagged Posts Tab */}
        {activeTab === 'flagged' && (
          <div className="space-y-4">
            {flaggedPosts.length === 0 ? (
              <div className="bg-[#0a0a0a] rounded-xl p-8 text-center border border-gray-800">
                <Check className="w-12 h-12 text-[#1DB954] mx-auto mb-3" />
                <p className="text-gray-400">No flagged posts to review</p>
              </div>
            ) : (
              flaggedPosts.map((post) => (
                <div key={post.id} className="bg-[#0a0a0a] rounded-xl p-5 border border-gray-800">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.userAvatar}
                        alt={post.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{post.username}</p>
                        <p className="text-gray-400 text-sm">{post.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full">
                      <Flag className="w-4 h-4 text-red-500" />
                      <span className="text-red-500 text-sm font-medium">{post.flagCount} flags</span>
                    </div>
                  </div>

                  {/* Album Info (if review) */}
                  {post.postType === 'review' && post.albumTitle && (
                    <div className="mb-3 pb-3 border-b border-gray-800">
                      <p className="text-sm text-gray-400">Review of</p>
                      <p className="text-white font-medium">{post.albumTitle}</p>
                      <p className="text-gray-400 text-sm">{post.artistName}</p>
                    </div>
                  )}

                  {/* Content */}
                  {editingPostId === post.id ? (
                    <div className="mb-4">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-[#1DB954]"
                        rows={4}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          className="px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760] transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-black rounded-lg border border-gray-800">
                      <p className="text-white">{post.content}</p>
                    </div>
                  )}

                  {/* Flag Reason */}
                  <div className="mb-4 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                    <p className="text-sm text-gray-400 mb-1">Flag Reason:</p>
                    <p className="text-red-400 font-medium">{post.flagReason}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPost(post.id, post.content)}
                      className="flex-1 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 border border-blue-500/20"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => handleDismissFlag(post.id)}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* User Reports Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {userReports.map((user) => (
              <div key={user.userId} className="bg-[#0a0a0a] rounded-xl p-5 border border-gray-800">
                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.userAvatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-red-500 text-sm font-medium">{user.flagCount} total flags</span>
                    </div>
                    {user.accountStatus === 'warned' && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/20">
                        WARNED
                      </span>
                    )}
                    {user.accountStatus === 'banned' && (
                      <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full border border-red-500/20">
                        BANNED
                      </span>
                    )}
                  </div>
                </div>

                {/* Recent Flags */}
                <div className="mb-4 p-3 bg-black rounded-lg border border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Recent Violations:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.recentFlags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {user.accountStatus !== 'warned' && user.accountStatus !== 'banned' && (
                    <button
                      onClick={() => handleWarnUser(user.userId)}
                      className="flex-1 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2 border border-yellow-500/20"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Issue Warning
                    </button>
                  )}
                  {user.accountStatus !== 'banned' && (
                    <button
                      onClick={() => handleBanUser(user.userId)}
                      className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                    >
                      <Ban className="w-4 h-4" />
                      Ban Account
                    </button>
                  )}
                  {user.accountStatus === 'banned' && (
                    <button
                      onClick={() => handleUnbanUser(user.userId)}
                      className="flex-1 px-4 py-2 bg-[#1DB954]/10 text-[#1DB954] rounded-lg hover:bg-[#1DB954]/20 transition-colors flex items-center justify-center gap-2 border border-[#1DB954]/20"
                    >
                      <Check className="w-4 h-4" />
                      Unban Account
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <button
          onClick={() => onNavigate('home')}
          className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}