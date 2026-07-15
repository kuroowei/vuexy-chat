import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useCall } from '@/contexts/CallContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

type CallDirection = 'incoming' | 'outgoing';
type CallBackendStatus = 'ringing' | 'accepted' | 'declined' | 'missed' | 'ended';

interface CallRecord {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  direction: CallDirection;
  type: 'audio' | 'video';
  status: CallBackendStatus;
  startedAt: string;
  acceptedAt?: string;
  endedAt?: string;
  duration: number; // seconds
}

const getAvatarUrl = (name: string, existingAvatar: string): string => {
  if (existingAvatar && existingAvatar.trim() !== '') {
    if (existingAvatar.startsWith('http') || existingAvatar.startsWith('data:')) {
      return existingAvatar;
    }
    if (existingAvatar.startsWith('/')) {
      return `${BACKEND_URL}${existingAvatar}`;
    }
    return `${BACKEND_URL}/${existingAvatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128&bold=true`;
};

// Collapse the backend's 5-state status + direction into the 3 visual
// categories the UI actually distinguishes: incoming, outgoing, missed.
const getDisplayStatus = (call: CallRecord): 'incoming' | 'outgoing' | 'missed' => {
  if (call.status === 'missed' || call.status === 'declined') return 'missed';
  return call.direction;
};

const statusConfig = {
  incoming: { icon: PhoneIncoming, color: 'text-green-600', bg: 'bg-green-50' },
  outgoing: { icon: PhoneOutgoing, color: 'text-blue-600', bg: 'bg-blue-50' },
  missed: { icon: PhoneMissed, color: 'text-red-600', bg: 'bg-red-50' },
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function CallsPage() {
  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState<'all' | 'missed'>('all');
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/calls`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load call history');
        setCalls(data.calls || []);
      } catch (err: any) {
        console.error('Failed to fetch call history:', err);
        setError('Could not load call history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const filteredCalls =
    activeTab === 'all' ? calls : calls.filter((c) => getDisplayStatus(c) === 'missed');

  const handleRedial = (call: CallRecord, type: 'audio' | 'video') => {
    startCall(call.contactId, call.contactName, call.contactAvatar, type);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('missed')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'missed' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading call history...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Call List */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto pb-20">
          {filteredCalls.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {activeTab === 'missed' ? 'No missed calls' : 'No call history yet'}
              </p>
            </div>
          ) : (
            filteredCalls.map((call) => {
              const displayStatus = getDisplayStatus(call);
              const StatusIcon = statusConfig[displayStatus].icon;
              const statusColor = statusConfig[displayStatus].color;
              const statusBg = statusConfig[displayStatus].bg;

              return (
                <div
                  key={call.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={getAvatarUrl(call.contactName, call.contactAvatar)}
                      alt={call.contactName}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(call.contactName)}&background=7c3aed&color=fff&size=128&bold=true`;
                      }}
                    />
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${statusBg}`}>
                      <StatusIcon size={12} className={statusColor} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{call.contactName}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {call.type === 'video' ? <Video size={14} /> : <Phone size={14} />}
                      <span>{formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}</span>
                      {call.duration > 0 && <span>· {formatDuration(call.duration)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRedial(call, 'audio')}
                      className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      title="Call back"
                    >
                      <Phone size={18} />
                    </button>
                    <button
                      onClick={() => handleRedial(call, 'video')}
                      className="p-2.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      title="Video call"
                    >
                      <Video size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}