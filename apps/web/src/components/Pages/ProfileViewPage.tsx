import { 
  ArrowLeft, Camera, MapPin, Link as LinkIcon, 
  Calendar, Mail, Phone, MessageCircle, Video, PhoneCall, MoreHorizontal, Edit3
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfileViewPageProps {
  onBack: () => void;
}

export default function ProfileViewPage({ onBack }: ProfileViewPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'about' | 'media'>('about');

  const userProfile = {
    name: 'Alex Johnson',
    username: '@alexjohnson',
    avatar: 'https://i.pravatar.cc/150?u=99',
    bio: 'Full-stack developer | Coffee lover | Building amazing things',
    location: 'San Francisco, CA',
    website: 'alexjohnson.dev',
    joined: 'March 2023',
    email: 'alex@example.com',
    phone: '+1 234 567 8900',
    stats: {
      chats: 142,
      contacts: 89,
      calls: 56,
    },
  };

  const mediaItems = [
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/200/200?random=2',
    'https://picsum.photos/200/200?random=3',
    'https://picsum.photos/200/200?random=4',
    'https://picsum.photos/200/200?random=5',
    'https://picsum.photos/200/200?random=6',
  ];

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
            <div className="relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-16 px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">{userProfile.name}</h2>
          <p className="text-sm text-gray-500">{userProfile.username}</p>
          <p className="mt-2 text-sm text-gray-600">{userProfile.bio}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-4 px-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
            <MessageCircle size={16} />
            Message
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            <Video size={16} />
            Video
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            <PhoneCall size={16} />
            Call
          </button>
        </div>

        {/* Stats */}
        <div className="mx-4 mt-6 p-4 bg-white rounded-2xl shadow-sm">
          <div className="flex justify-around">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{userProfile.stats.chats}</p>
              <p className="text-xs text-gray-500">Chats</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{userProfile.stats.contacts}</p>
              <p className="text-xs text-gray-500">Contacts</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{userProfile.stats.calls}</p>
              <p className="text-xs text-gray-500">Calls</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'about' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'media' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500'
              }`}
            >
              Media
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'about' ? (
              <div className="space-y-3">
                <InfoCard icon={MapPin} label="Location" value={userProfile.location} />
                <InfoCard icon={LinkIcon} label="Website" value={userProfile.website} />
                <InfoCard icon={Calendar} label="Joined" value={userProfile.joined} />
                <InfoCard icon={Mail} label="Email" value={userProfile.email} />
                <InfoCard icon={Phone} label="Phone" value={userProfile.phone} />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    alt={`Media ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
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
