import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Video as VideoIcon, X, Heart, MessageCircle, Send, Trash2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB, matches the backend's multer limit

interface AuthorSummary {
  id: string;
  name: string;
  avatar: string;
}

interface CommentItem {
  id: string;
  author: AuthorSummary;
  text: string;
  createdAt: string;
}

interface PostItem {
  id: string;
  author: AuthorSummary;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likeCount: number;
  likedByMe: boolean;
  comments: CommentItem[];
  createdAt: string;
}

const getAvatarUrl = (name: string, avatar?: string): string => {
  if (avatar && avatar.trim() !== '') return avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128&bold=true`;
};

export default function FeedPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<{ file: File; preview: string } | null>(null);
  const [composerVideo, setComposerVideo] = useState<{ file: File; preview: string } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const viewedVideoIds = useRef<Set<string>>(new Set());

  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`});
  
  const recordView = (postId: string) => {
    if (viewedVideoIds.current.has(postId)) return;
    viewedVideoIds.current.add(postId);
    fetch(`${API_BASE_URL}/posts/${postId}/view`, { method: 'POST', headers: authHeaders() }).catch((err) =>
      console.error('Failed to record view:', err)
    );
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/posts`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load feed');
      setPosts(data.posts || []);
    } catch (err: any) {
      console.error('Error fetching feed:', err);
      setError('Could not load the feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }
    if (composerVideo) {
      URL.revokeObjectURL(composerVideo.preview);
      setComposerVideo(null);
    }
    setComposerImage({ file, preview: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      alert('Video must be less than 50MB');
      return;
    }
    if (composerImage) {
      URL.revokeObjectURL(composerImage.preview);
      setComposerImage(null);
    }
    setComposerVideo({ file, preview: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const clearComposerMedia = () => {
    if (composerImage) URL.revokeObjectURL(composerImage.preview);
    if (composerVideo) URL.revokeObjectURL(composerVideo.preview);
    setComposerImage(null);
    setComposerVideo(null);
  };

  const handleSubmitPost = async () => {
    if (!composerText.trim() && !composerImage && !composerVideo) return;
    setIsPosting(true);
    setError('');

    try {
      const formData = new FormData();
      if (composerText.trim()) formData.append('content', composerText.trim());
      if (composerImage) formData.append('image', composerImage.file);
      if (composerVideo) formData.append('video', composerVideo.file);

      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create post');

      setPosts((prev) => [data.post, ...prev]);
      setComposerText('');
      clearComposerMedia();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleLike = async (post: PostItem) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1: 1) }
          : p
      )
    );

    try {
      const res = await fetch(`${API_BASE_URL}/posts/${post.id}/like`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to update like');
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likeCount: data.likeCount, likedByMe: data.likedByMe } : p))
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
            : p
        )
      );
    }
  };

  const toggleCommentsVisible = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleSubmitComment = async (postId: string) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;

    setPostingComment(postId);
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add comment');

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, data.comment] } : p))
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setPostingComment(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setOpenMenuPostId(null);
    if (!window.confirm('Delete this post? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete post');
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="px-4 md:px-8 pt-16 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          {/* Composer */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full resize-none border-none focus:outline-none text-sm text-gray-800 placeholder:text-gray-400"
            />

            {composerImage && (
              <div className="relative mt-2 rounded-xl overflow-hidden">
                <img src={composerImage.preview} alt="Preview" className="w-full max-h-80 object-cover" />
                <button
                  onClick={clearComposerMedia}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {composerVideo && (
              <div className="relative mt-2 rounded-xl overflow-hidden bg-black">
                <video src={composerVideo.preview} controls className="w-full max-h-80" />
                <button
                  onClick={clearComposerMedia}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                  <ImageIcon size={18} /> Photo
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                  <VideoIcon size={18} /> Video
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />

              <button
                onClick={handleSubmitPost}
                disabled={isPosting || (!composerText.trim() && !composerImage && !composerVideo)}
                className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              <p className="mt-2 text-sm text-gray-500">Loading feed...</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No posts yet — be the first to share something!</p>
            </div>
          )}

          {!loading &&
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(post.author.name, post.author.avatar)}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getAvatarUrl(post.author.name);
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{post.author.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {post.author.id === currentUserId && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuPostId === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {post.content && (
                  <p className="px-4 pb-3 text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
                )}

                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post" className="w-full max-h-[480px] object-cover" />
                )}

                  {post.videoUrl && (
                  <video
                    src={post.videoUrl}
                    controls
                    className="w-full max-h-[480px] bg-black"
                    onPlay={() => recordView(post.id)}
                  />
                )}

                <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 mt-1">
                  <button
                    onClick={() => handleToggleLike(post)}
                    className={
                      'flex items-center gap-1.5 text-sm font-medium ' +
                      (post.likedByMe ? 'text-red-500' : 'text-gray-500 hover:text-red-500')
                    }
                  >
                    <Heart size={18} fill={post.likedByMe ? 'currentColor' : 'none'} />
                    {post.likeCount > 0 && post.likeCount}
                  </button>
                  <button
                    onClick={() => toggleCommentsVisible(post.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-purple-600"
                  >
                    <MessageCircle size={18} />
                    {post.comments.length > 0 && post.comments.length}
                  </button>
                </div>

                {expandedComments.has(post.id) && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2.5">
                        <img
                          src={getAvatarUrl(comment.author.name, comment.author.avatar)}
                          alt={comment.author.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getAvatarUrl(comment.author.name);
                          }}
                        />
                        <div className="bg-gray-50 rounded-2xl px-3 py-2 flex-1">
                          <p className="text-xs font-semibold text-gray-900">{comment.author.name}</p>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmitComment(post.id);
                        }}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={postingComment === post.id || !(commentDrafts[post.id] || '').trim()}
                        className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}