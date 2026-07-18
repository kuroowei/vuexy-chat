import {
  ArrowLeft, Mail, Phone, Edit3, Circle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

interface ProfileViewPageProps {
  onBack: () => void;
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

export default function ProfileViewPage({ onBack }: ProfileViewPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(user.name, user.avatar);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <button
          onClick={() => navigate('/profile')}
          className="ml-auto p-2 hover:bg-gray-100 rounded-full text-purple-600"
          title="Edit Profile"
        >
          <Edit3 size={20} />
        </button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Cover & Avatar */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <img
              src={avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-white object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff&size=128&bold=true`;
              }}
            />
          </div>
        </div>

        {/* Name */}
        <div className="mt-16 px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Circle size={8} className="fill-green-500 text-green-500" />
            <p className="text-sm text-gray-500">Your account</p>
          </div>
        </div>

        {/* Edit Profile call-to-action */}
        <div className="flex justify-center mt-4 px-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        </div>

        {/* Contact info */}
        <div className="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            <InfoCard icon={Mail} label="Email" value={user.email} />
            <InfoCard icon={Phone} label="Phone" value={user.phone || 'Not set'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="p-2 bg-white rounded-lg">
        <Icon size={18} className="text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}