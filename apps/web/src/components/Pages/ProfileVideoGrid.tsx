import { useEffect, useState, useRef } from 'react';
import { Play, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

interface VideoPost {
  id: string;
  videoUrl: string;
  content: string;
  createdAt: string;
}

interface ProfileVideoGridProps {
  userId: string;
}

// Cloudinary auto-generates a poster frame for any uploaded video at the
// same path with a .jpg extension — much cheaper to load in a grid than
// pulling in the actual video just to show a thumbnail.
const getVideoThumbnail = (videoUrl: string): string => videoUrl.replace(/\.[^./]+$/, '.jpg');

const recordView = (postId: string, viewedIds: Set<string>) => {
  if (viewedIds.has(postId)) return;
  viewedIds.add(postId);
  const token = localStorage.getItem('token');
  fetch(`${API_BASE_URL}/posts/${postId}/view`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch((err) => console.error('Failed to record view:', err));
};

export default function ProfileVideoGrid({ userId }: ProfileVideoGridProps) {
  const [videos, setVideos] = useState<VideoPost[]>([]);
    const viewedVideoIds = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoPost | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/posts/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setVideos((data.posts || []).filter((p: any) => !!p.videoUrl));
        }
      } catch (err) {
        console.error('Failed to load profile videos:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <>
      <div className="mx-4 mt-6 max-w-md">
        <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">Videos</h3>
        <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="relative aspect-square bg-black group"
            >
              <img
                src={getVideoThumbnail(video.videoUrl)}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <Play size={22} className="text-white" fill="white" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedVideo && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center px-4"
          onClick={() => setSelectedVideo(null)}
        >
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <X size={22} />
          </button>
          <video
            src={selectedVideo.videoUrl}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onPlay={() => recordView(selectedVideo.id, viewedVideoIds.current)}
          />
        </div>
      )}
    </>
  );
}
