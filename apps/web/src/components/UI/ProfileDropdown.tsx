import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Helper function to get full image URL
  const getImageUrl = (avatarPath: string): string => {
    if (!avatarPath) return '';
    // If it already starts with http, return as-is
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    // If it starts with /, prepend backend URL
    if (avatarPath.startsWith('/')) {
      return `${API_BASE.replace('/api', '')}${avatarPath}`;
    }
    // Otherwise assume it's a relative path from backend
    return `${API_BASE.replace('/api', '')}/${avatarPath}`;
  };

  const handleEditProfile = () => {
    console.log('Navigating to /profile');
    setIsOpen(false);
    setTimeout(() => {
      navigate('/profile');
    }, 100);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // Get proper avatar URL
  const avatarUrl = getImageUrl(user.avatar);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors w-full"
        title="Click to open menu"
      >
        <img
          src={avatarUrl}
          alt={user?.name}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            console.error('Sidebar avatar error:', (e.target as HTMLImageElement).src);
            // Fallback to initials avatar if image fails
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7c3aed&color=fff&size=128&bold=true`;
          }}
        />
        <span className="text-sm font-medium text-gray-700 hidden sm:inline truncate">
          {user?.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          <button
            onClick={handleEditProfile}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings size={16} />
            Edit Profile
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
