import { 
  User, Bell, Shield, Moon, Globe, HelpCircle, 
  ChevronRight, LogOut, Smartphone, Volume2, 
  Lock, Palette, Users
} from 'lucide-react';
import { useState } from 'react';

interface SettingItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  type: 'toggle' | 'link' | 'danger' | 'profile';
  value?: boolean;
  onClick?: () => void;
}

interface SettingsHubPageProps {
  onNavigateToProfile: () => void;
}

export default function SettingsHubPage({ onNavigateToProfile }: SettingsHubPageProps) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    darkMode: false,
    notifications: true,
    readReceipts: true,
  });

  const toggleValue = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const accountSettings: SettingItem[] = [
    { 
      id: 'profile', 
      icon: User, 
      label: 'Edit Profile', 
      description: 'Name, photo, bio', 
      type: 'profile',
      onClick: onNavigateToProfile 
    },
    { id: 'privacy', icon: Lock, label: 'Privacy', description: 'Last seen, profile photo', type: 'link' },
    { id: 'security', icon: Shield, label: 'Security', description: 'Two-step verification', type: 'link' },
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
    { id: 'logout', icon: LogOut, label: 'Log Out', type: 'danger' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="mx-4 mt-4 p-4 bg-white rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
           onClick={onNavigateToProfile}>
        <div className="flex items-center gap-4">
          <img
            src="https://i.pravatar.cc/150?u=99"
            alt="Your Profile"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Your Name</h2>
            <p className="text-sm text-gray-500">+1 234 567 8900</p>
            <p className="text-xs text-gray-400 mt-1">Hey there! I am using Vuexy Chat.</p>
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
