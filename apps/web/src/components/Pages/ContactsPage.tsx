import { Search, Phone, Video, MoreVertical, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: string;
  phone: string;
}

const demoContacts: Contact[] = [
  { id: '1', name: 'Gavin Griffith', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online', lastSeen: 'Active now', phone: '+1 234 567 8901' },
  { id: '2', name: 'Harriet McBride', avatar: 'https://i.pravatar.cc/150?u=2', status: 'online', lastSeen: 'Active now', phone: '+1 234 567 8902' },
  { id: '3', name: 'Danny Conner', avatar: 'https://i.pravatar.cc/150?u=3', status: 'offline', lastSeen: '2 hours ago', phone: '+1 234 567 8903' },
  { id: '4', name: 'Janie West', avatar: 'https://i.pravatar.cc/150?u=4', status: 'busy', lastSeen: 'In a meeting', phone: '+1 234 567 8904' },
  { id: '5', name: 'Bryan Murray', avatar: 'https://i.pravatar.cc/150?u=5', status: 'online', lastSeen: 'Active now', phone: '+1 234 567 8905' },
  { id: '6', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?u=6', status: 'offline', lastSeen: '5 hours ago', phone: '+1 234 567 8906' },
  { id: '7', name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?u=7', status: 'online', lastSeen: 'Active now', phone: '+1 234 567 8907' },
  { id: '8', name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?u=8', status: 'busy', lastSeen: 'On a call', phone: '+1 234 567 8908' },
];

interface ContactsPageProps {
  onStartCall?: (contactId: string, type: 'audio' | 'video') => void;
  onStartChat?: (contactId: string) => void;
}

export default function ContactsPage({ onStartCall, onStartChat }: ContactsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'online'>('all');
  const [showOptions, setShowOptions] = useState<string | null>(null);

  const filteredContacts = demoContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'online' && contact.status === 'online');
    return matchesSearch && matchesTab;
  });

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
  };

  const handleAudioCall = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartCall) {
      onStartCall(contactId, 'audio');
    } else {
      alert(`Starting audio call with ${demoContacts.find(c => c.id === contactId)?.name}...`);
    }
  };

  const handleVideoCall = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartCall) {
      onStartCall(contactId, 'video');
    } else {
      alert(`Starting video call with ${demoContacts.find(c => c.id === contactId)?.name}...`);
    }
  };

  const handleMessage = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartChat) {
      onStartChat(contactId);
    } else {
      alert(`Opening chat with ${demoContacts.find(c => c.id === contactId)?.name}...`);
    }
  };

  const handleMoreOptions = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(showOptions === contactId ? null : contactId);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Contacts</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'online' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {filteredContacts.length} Contacts
          </p>
        </div>
        
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group relative"
          >
            <div className="relative">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[contact.status]}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
              <p className="text-sm text-gray-500">{contact.lastSeen}</p>
            </div>

            {/* Action Buttons - Always visible on mobile */}
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => handleMessage(contact.id, e)}
                className="p-2 hover:bg-purple-50 rounded-full text-purple-600"
                title="Message"
              >
                <MessageCircle size={18} />
              </button>
              <button 
                onClick={(e) => handleAudioCall(contact.id, e)}
                className="p-2 hover:bg-green-50 rounded-full text-green-600"
                title="Audio Call"
              >
                <Phone size={18} />
              </button>
              <button 
                onClick={(e) => handleVideoCall(contact.id, e)}
                className="p-2 hover:bg-blue-50 rounded-full text-blue-600"
                title="Video Call"
              >
                <Video size={18} />
              </button>
              <div className="relative">
                <button 
                  onClick={(e) => handleMoreOptions(contact.id, e)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                  title="More"
                >
                  <MoreVertical size={18} />
                </button>
                
                {/* Dropdown for more options */}
                {showOptions === contact.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700">
                      View Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700">
                      Block Contact
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600">
                      Delete Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
