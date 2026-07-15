import { 
  User, Bell, Shield, Moon, Globe, HelpCircle, 
  ChevronRight, LogOut, Smartphone, Volume2, 
  MessageSquare, Lock, Eye, Trash2
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

interface SettingItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  type: 'toggle' | 'link' | 'danger';
  value?: boolean;
}

const preferenceSettings: SettingItem[] = [
  { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Message tones, group alerts', type: 'link' },
  { id: 'darkMode', icon: Moon, label: 'Dark Mode', type: 'toggle', value: false },
  { id: 'sound', icon: Volume2, label: 'Sounds', description: 'Ringtone, message tone', type: 'link' },
  { id: 'language', icon: Globe, label: 'Language', description: 'English (US)', type: 'link' },
];

const otherSettings: SettingItem[] = [
  { id: 'help', icon: HelpCircle, label: 'Help & Support', type: 'link' },
  { id: 'storage', icon: Smartphone, label: 'Storage & Data', description: '2.4 GB used', type: 'link' },
];

function SettingSection({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: SettingItem[];
  onItemClick?: (id: string) => void;
}) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  const toggleValue = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClick = (item: SettingItem) => {
    if (item.type === 'toggle') {
      toggleValue(item.id);
    } else if (onItemClick) {
      onItemClick(item.id);
    }
  };

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
              onClick={() => handleClick(item)}
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

              {item.type === 'link' && (
                <ChevronRight size={20} className="text-gray-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getImageUrl = (avatarPath?: string): string => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) return avatarPath;
    if (avatarPath.startsWith('/')) return `${BACKEND_URL}${avatarPath}`;
    return `${BACKEND_URL}/${avatarPath}`;
  };

  const accountSettings: SettingItem[] = [
    { id: 'profile', icon: User, label: 'Edit Profile', description: 'Name, photo, bio', type: 'link' },
    { id: 'privacy', icon: Lock, label: 'Privacy', description: 'Last seen, profile photo', type: 'link' },
    { id: 'security', icon: Shield, label: 'Security', description: 'Two-step verification', type: 'link' },
  ];

  const dangerSettings: SettingItem[] = [
    { id: 'logout', icon: LogOut, label: 'Log Out', type: 'danger' },
  ];

  const handleSettingClick = (id: string) => {
    if (id === 'profile') {
      navigate('/profile');
    } else if (id === 'logout') {
      logout();
    }
    // privacy, security, notifications, sound, language, help, storage:
    // wire these up to real routes/modals as you build them out.
  };

  const displayAvatar = getImageUrl(user?.avatar);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile Card - now reflects the real logged-in user */}
      <div
        className="mx-4 mt-4 p-4 bg-white rounded-2xl shadow-sm cursor-pointer"
        onClick={() => navigate('/profile')}
      >
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
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            className="p-2 hover:bg-gray-100 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/profile');
            }}
          >
            <User size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 overflow-y-auto pb-20 mt-4">
        <SettingSection title="Account" items={accountSettings} onItemClick={handleSettingClick} />
        <SettingSection title="Preferences" items={preferenceSettings} onItemClick={handleSettingClick} />
        <SettingSection title="Other" items={otherSettings} onItemClick={handleSettingClick} />
        <SettingSection title="" items={dangerSettings} onItemClick={handleSettingClick} />
      </div>
    </div>
  );
}