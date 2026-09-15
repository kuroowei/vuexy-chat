import { useEffect, useState } from 'react';
import { X, Bot, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

interface FriendSummary {
  id: string;
  name: string;
  avatar: string;
}

interface AgentSettings {
  enabled: boolean;
  persona: string;
  excludedContactIds: string[];
  dailyReplyLimit: number;
  repliesSentToday: number;
}

interface AIAgentSettingsModalProps {
  onClose: () => void;
}

const getAvatarUrl = (name: string, existingAvatar: string): string => {
  if (existingAvatar && existingAvatar.trim() !== '') {
    if (existingAvatar.startsWith('http') || existingAvatar.startsWith('data:')) return existingAvatar;
    if (existingAvatar.startsWith('/')) return `${BACKEND_URL}${existingAvatar}`;
    return `${BACKEND_URL}/${existingAvatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128&bold=true`;
};

export default function AIAgentSettingsModal({ onClose }: AIAgentSettingsModalProps) {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const [settingsRes, friendsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/ai-agent/settings`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/friends`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const settingsData = await settingsRes.json();
        const friendsData = await friendsRes.json();
        if (!settingsRes.ok) throw new Error(settingsData.message || 'Failed to load Agent settings');
        setSettings(settingsData);
        setFriends((friendsData.users || []).map((u: any) => ({ id: u.id, name: u.name, avatar: u.avatar })));
      } catch (err: any) {
        console.error('Failed to load AI agent settings:', err);
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/ai-agent/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          enabled: settings.enabled,
          persona: settings.persona,
          excludedContactIds: settings.excludedContactIds,
          dailyReplyLimit: settings.dailyReplyLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save settings');
      setSettings(data);
      onClose();
    } catch (err: any) {
      console.error('Failed to save AI agent settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleExcluded = (contactId: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      excludedContactIds: settings.excludedContactIds.includes(contactId)
        ? settings.excludedContactIds.filter((id) => id !== contactId)
        : [...settings.excludedContactIds, contactId],
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Offline AI Agent</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-purple-600" />
            </div>
          )}

          {!loading && error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {!loading && settings && (
            <>
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <h3 className="font-medium text-gray-900">Enable Agent</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Let AI reply on your behalf to people who message you while you're offline.
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0 ${
                    settings.enabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      settings.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  How should it represent you?
                </label>
                <textarea
                  value={settings.persona}
                  onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                  placeholder="e.g. I'm usually at work 9-5 and slow to reply. Keep it casual."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Daily reply limit
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={settings.dailyReplyLimit}
                  onChange={(e) =>
                    setSettings({ ...settings, dailyReplyLimit: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })
                  }
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">{settings.repliesSentToday} sent today</p>
              </div>

              {friends.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Never auto-reply to
                  </label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {friends.map((f) => (
                      <label key={f.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={settings.excludedContactIds.includes(f.id)}
                          onChange={() => toggleExcluded(f.id)}
                          className="w-4 h-4 accent-purple-600"
                        />
                        <img
                          src={getAvatarUrl(f.name, f.avatar)}
                          alt={f.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-800">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && settings && (
          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
