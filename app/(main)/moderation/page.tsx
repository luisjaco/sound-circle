'use client'
import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Trash2, Edit3, Ban, Flag, X, Check, Loader2 } from 'lucide-react';
import ProfilePicture from '@/components/img/ProfilePicture';

interface FlaggedPost {
  id: number;
  type: 'song_review' | 'album_review';
  content: string;
  rating: string | number | null;
  createdAt: string;
  editedAt: string | null;
  username: string | null;
  userAvatar: string | null;
  itemName: string | null;
  artistName: string | null;
  flagCount: number;
  reasons: string[];
}

interface ReportedUser {
  userId: string;
  username: string;
  userAvatar: string | null;
  banned: boolean;
  warned: boolean;
  flagCount: number;
  recentReasons: string[];
}

export default function ModeratorPage() {
  const [activeTab, setActiveTab] = useState<'flagged' | 'users'>('flagged');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [userReports, setUserReports] = useState<ReportedUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [postsRes, usersRes] = await Promise.all([
          fetch('/api/moderation/posts'),
          fetch('/api/moderation/users'),
        ]);

        if (postsRes.status === 403 || usersRes.status === 403) {
          setAccessDenied(true);
          return;
        }

        if (!postsRes.ok || !usersRes.ok) {
          setLoadError('Failed to load moderation data. Please refresh.');
          return;
        }

        const postsData = await postsRes.json();
        const usersData = await usersRes.json();

        setFlaggedPosts(postsData.posts || []);
        setUserReports(usersData.users || []);
      } catch (err) {
        console.error('Failed to load moderation data:', err);
        setLoadError('Failed to load moderation data. Please refresh.');
      } finally {
        setLoading(false);
      }
    }

    async function loadUser() {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (res.ok) setCurrentUserId(data.user.id);
    }

    loadData();
    loadUser();
  }, []);

  const handleDeletePost = async (postId: number, type: 'song_review' | 'album_review') => {
    try {
      const res = await fetch(`/api/moderation/posts/${postId}?type=${type}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to delete post:', data.error);
        return;
      }
      setFlaggedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  const handleEditPost = (postId: number, content: string) => {
    setEditingPostId(postId);
    setEditedContent(content);
  };

  const handleSaveEdit = async (postId: number, type: 'song_review' | 'album_review') => {
    try {
      const res = await fetch(`/api/moderation/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: editedContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to save edit:', data.error);
        return;
      }
      setFlaggedPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, content: editedContent } : p)
      );
      setEditingPostId(null);
      setEditedContent('');
    } catch (err) {
      console.error('Save edit error:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditedContent('');
  };

  const handleDismissFlag = async (postId: number, type: 'song_review' | 'album_review') => {
    try {
      const res = await fetch(`/api/moderation/posts/${postId}/dismiss?type=${type}`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to dismiss flag:', data.error);
        return;
      }
      setFlaggedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Dismiss flag error:', err);
    }
  };

  const handleUserAction = async (userId: string, action: 'warn' | 'ban' | 'unban') => {
    try {
      if (userId === currentUserId) {
        alert('Cannot perform moderation actions on your own account.');
        return;
      }
      const res = await fetch(`/api/moderation/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error(`Failed to ${action} user:`, data.error);
        return;
      }
      setUserReports((prev) =>
        prev.map((u) => {
          if (u.userId !== userId) return u;
          if (action === 'warn') return { ...u, warned: true };
          if (action === 'ban') return { ...u, banned: true };
          if (action === 'unban') return { ...u, banned: false, warned: false };
          return u;
        })
      );
    } catch (err) {
      console.error(`${action} user error:`, err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
    </div>
  );

  if (accessDenied) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3">
      <Shield className="w-10 h-10 text-red-500" />
      <p className="text-white font-semibold text-lg">Access Denied</p>
      <p className="text-gray-400 text-sm">You do not have moderator privileges.</p>
    </div>
  );

  if (loadError) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-red-400 text-sm">{loadError}</p>
    </div>
  );

  return (
    <div className=" bg-black pb-6">
      {/* Header */}
      <header className='px-20'>
            <h1 className="text-5xl w-full font-bold pt-15 pb-3 border-b border-gray-800 flex items-center">
              <Shield className='h-12 w-12 mr-5' /> Moderator Dashboard
            </h1>
      </header>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('flagged')}
            className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 cursor-pointer ${activeTab === 'flagged' ? 'text-[#1DB954]' : 'text-gray-400 hover:text-white'
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
            className={`pb-3 px-2 font-medium transition-colors relative flex items-center gap-2 cursor-pointer ${activeTab === 'users' ? 'text-[#1DB954]' : 'text-gray-400 hover:text-white'
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
                      <ProfilePicture size={14} src={post.userAvatar ? post.userAvatar : undefined} />
                      <div>
                        <p className="text-white font-medium">{post.username || 'Unknown user'}</p>
                        <p className="text-gray-400 text-sm">{post.type === 'song_review' ? 'Song Review' : 'Album Review'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full">
                      <Flag className="w-4 h-4 text-red-500" />
                      <span className="text-red-500 text-sm font-medium">{post.flagCount} flags</span>
                    </div>
                  </div>

                  {/* Album/Song Info */}
                  {post.itemName && (
                    <div className="mb-3 pb-3 border-b border-gray-800">
                      <p className="text-sm text-gray-400">Review of</p>
                      <p className="text-white font-medium">{post.itemName}</p>
                      {post.artistName && <p className="text-gray-400 text-sm">{post.artistName}</p>}
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
                          onClick={() => handleSaveEdit(post.id, post.type)}
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
                      <p className="text-white">{post.content || 'No content'}</p>
                    </div>
                  )}

                  {/* Flag Reason */}
                  <div className="mb-4 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                    <p className="text-sm text-gray-400 mb-1">Flag Reasons:</p>
                    <div className="flex flex-wrap gap-2">
                      {post.reasons.length > 0 ? (
                        post.reasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20"
                          >
                            {reason}
                          </span>
                        ))
                      ) : (
                        <p className="text-red-400 text-sm">No reason</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPost(post.id, post.content || '')}
                      className="flex-1 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 border border-blue-500/20 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id, post.type)}
                      className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => handleDismissFlag(post.id, post.type)}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
            {userReports.length === 0 ? (
              <div className="bg-[#0a0a0a] rounded-xl p-8 text-center border border-gray-800">
                <Check className="w-12 h-12 text-[#1DB954] mx-auto mb-3" />
                <p className="text-gray-400">No reported users</p>
              </div>
            ) : (
              userReports.map((user) => (
                <div key={user.userId} className="bg-[#0a0a0a] rounded-xl p-5 border border-gray-800">
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ProfilePicture size={14} src={user.userAvatar ? user.userAvatar : undefined} />
                      <div>
                        <p className="text-white font-medium">{user.username}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-red-500 text-sm font-medium">{user.flagCount} total flags</span>
                      </div>
                      {user.warned && !user.banned && (
                        <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/20">
                          WARNED
                        </span>
                      )}
                      {user.banned && (
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
                      {user.recentReasons.length > 0 ? (
                        user.recentReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20"
                          >
                            {reason}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No violations recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!user.warned && !user.banned && (
                      <button
                        onClick={() => handleUserAction(user.userId, 'warn')}
                        className="flex-1 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2 border border-yellow-500/20 cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Issue Warning
                      </button>
                    )}
                    {!user.banned && (
                      <button
                        onClick={() => handleUserAction(user.userId, 'ban')}
                        className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer"
                      >
                        <Ban className="w-4 h-4" />
                        Ban Account
                      </button>
                    )}
                    {user.banned && (
                      <button
                        onClick={() => handleUserAction(user.userId, 'unban')}
                        className="flex-1 px-4 py-2 bg-[#1DB954]/10 text-[#1DB954] rounded-lg hover:bg-[#1DB954]/20 transition-colors flex items-center justify-center gap-2 border border-[#1DB954]/20 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        Unban Account
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}