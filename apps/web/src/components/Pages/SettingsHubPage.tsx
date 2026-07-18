import {
  User, Bell, Shield, Moon, Globe, HelpCircle,
  ChevronRight, LogOut, Smartphone, Volume2,
  Lock, Palette, Users, X, ShieldOff
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

interface SettingItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  type: 'toggle' | 'link' | 'danger' | 'profile';
  value?: boolean;
  onClick?: () => void;
}

interface BlockedContact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

interface SettingsHubPageProps {
  onNavigateToProfile: () => void;
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

export default function SettingsHubPage({ onNavigateToProfile }: SettingsHubPageProps) {
  const { user, logout } = useAuth();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    darkMode: false,
    notifications: true,
    readReceipts: true,
  });

  const [showBlocked, setShowBlocked] = useState(false);
  const [blockedContacts, setBlockedContacts] = useState<BlockedContact[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [blockedError, setBlockedError] = useState('');

  const toggleValue = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchBlockedContacts = async () => {
    setLoadingBlocked(true);
    setBlockedError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/blocked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load blocked contacts');
      setBlockedContacts(data.blocked || []);
    } catch (err: any) {
      console.error('Failed to fetch blocked contacts:', err);
      setBlockedError('Could not load blocked contacts.');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleOpenBlocked = () => {
    setShowBlocked(true);
    fetchBlockedContacts();
  };

  const handleUnblock = async (contact: BlockedContact) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/${contact.id}/unblock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to unblock contact');
      setBlockedContacts(prev => prev.filter(c => c.id !== contact.id));
    } catch (err: any) {
      console.error('Unblock error:', err);
      setBlockedError(err.message || 'Failed to unblock contact');
    }
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      icon: User,
      label: 'Edit Profile',
      description: 'Name, photo, phone number',
      type: 'profile',
      onClick: onNavigateToProfile
    },
    { id: 'privacy', icon: Lock, label: 'Privacy', description: 'Last seen, profile photo', type: 'link' },
    { id: 'security', icon: Shield, label: 'Security', description: 'Two-step verification', type: 'link' },
    {
      id: 'blocked',
      icon: ShieldOff,
      label: 'Blocked Contacts',
      description: 'Manage people you\'ve blocked',
      type: 'link',
      onClick: handleOpenBlocked,
    },
  ];

  const preferenceSettings: SettingItem[] = [
    { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Message tones, group alerts', type: 'link' },
    { id: 'darkMode', icon: Moon, label: 'Dark Mode', type: 'toggle', value: toggles.darkMode },
    { id: 'sound', icon: Volume2, label: 'Sounds', description: 'Ringtone, message tone', type: 'link' },
    { id: 'language', icon: Globe, label: 'Language', description: 'English (US)', type: 'link' },
    { id: 'appearance', icon: Palette, label: 'Appearance', description: 'Theme, chat wallpaper', type: 'link' },
  ];

  const otherSettings: SettingItem[] = [
    { id: 'contacts', icon: Users, label: 'Contact Us', type: 'link' },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', type: 'link' },
    { id: 'storage', icon: Smartphone, label: 'Storage & Data', description: '2.4 GB used', type: 'link' },
    { id: 'logout', icon: LogOut, label: 'Log Out', type: 'danger', onClick: logout },
  ];

  const displayAvatar = getAvatarUrl(user?.name || 'User', user?.avatar || '');

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile Card - now reflects the real logged-in user */}
      <div className="mx-4 mt-4 p-4 bg-white rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
           onClick={onNavigateToProfile}>
        <div className="flex items-center gap-4">
          <img
            src={displayAvatar}
            alt={user?.name || 'Your Profile'}
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7c3aed&color=fff&size=128&bold=true`;
            }}
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{user?.name || 'Your Name'}</h2>
            <p className="text-sm text-gray-500">{user?.phone || 'No phone number'}</p>
            <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 overflow-y-auto pb-20 mt-4">
        <SettingSection title="Account" items={accountSettings} toggles={toggles} onToggle={toggleValue} />
        <SettingSection title="Preferences" items={preferenceSettings} toggles={toggles} onToggle={toggleValue} />
        <SettingSection title="Other" items={otherSettings} toggles={toggles} onToggle={toggleValue} />
      </div>

      {/* Blocked Contacts modal */}
      {showBlocked && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setShowBlocked(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Blocked Contacts</h2>
              <button
                onClick={() => setShowBlocked(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingBlocked && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              )}

              {!loadingBlocked && blockedError && (
                <p className="text-sm text-red-600 text-center py-10 px-4">{blockedError}</p>
              )}

              {!loadingBlocked && !blockedError && blockedContacts.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-10 px-4">
                  You haven't blocked anyone.
                </p>
              )}

              {!loadingBlocked && !blockedError && blockedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-b-0"
                >
                  <img
                    src={getAvatarUrl(contact.name, contact.avatar)}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=7c3aed&color=fff&size=128&bold=true`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{contact.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{contact.phone || 'No phone number'}</p>
                  </div>
                  <button
                    onClick={() => handleUnblock(contact)}
                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors flex-shrink-0"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingSection({
  title,
  items,
  toggles,
  onToggle
}: {
  title: string;
  items: SettingItem[];
  toggles: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mb-6">
      <h2 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h2>
      <div className="bg-white">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.type === 'toggle') {
                  onToggle(item.id);
                } else if (item.onClick) {
                  item.onClick();
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                !isLast ? 'border-b border-gray-100' : ''
              } ${item.type === 'danger' ? 'text-red-600' : 'text-gray-900'}`}
            >
              <div className={`p-2 rounded-xl ${
                item.type === 'danger' ? 'bg-red-50' : 'bg-gray-100'
              }`}>
                <Icon size={20} className={item.type === 'danger' ? 'text-red-600' : 'text-gray-600'} />
              </div>

              <div className="flex-1 text-left">
                <h3 className="font-medium">{item.label}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500">{item.description}</p>
                )}
              </div>

              {item.type === 'toggle' && (
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  toggles[item.id] ? 'bg-purple-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    toggles[item.id] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              )}

              {(item.type === 'link' || item.type === 'profile' || item.type === 'danger') && (
                <ChevronRight size={20} className={item.type === 'danger' ? 'text-red-400' : 'text-gray-400'} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}