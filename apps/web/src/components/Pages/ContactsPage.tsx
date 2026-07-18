import { Search, Phone, Video, MoreVertical, MessageCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
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

const getStatusLabel = (status: Contact['status'], lastSeen: string): string => {
  if (status === 'online') return 'Active now';
  if (status === 'busy') return 'Busy';
  if (status === 'away') return 'Away';
  if (!lastSeen) return 'Offline';
  try {
    return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
  } catch {
    return 'Offline';
  }
};

interface ContactsPageProps {
  onStartCall?: (contactId: string, contactName: string, contactAvatar: string, type: 'audio' | 'video') => void;
  onStartChat?: (contactId: string) => void;
}

export default function ContactsPage({ onStartCall, onStartChat }: ContactsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'online'>('all');
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileContact, setProfileContact] = useState<Contact | null>(null);
  const [actionError, setActionError] = useState('');

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load contacts');
      setContacts(data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err);
      setError('Could not load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      contact.name.toLowerCase().includes(q) ||
      (contact.phone && contact.phone.includes(searchQuery));
    const matchesTab = activeTab === 'all' || (activeTab === 'online' && contact.status === 'online');
    return matchesSearch && matchesTab;
  });

  const statusColors: Record<Contact['status'], string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const handleAudioCall = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartCall) {
      onStartCall(contact.id, contact.name, contact.avatar, 'audio');
    } else {
      alert(`Starting audio call with ${contact.name}...`);
    }
  };

  const handleVideoCall = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartCall) {
      onStartCall(contact.id, contact.name, contact.avatar, 'video');
    } else {
      alert(`Starting video call with ${contact.name}...`);
    }
  };

  const handleMessage = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartChat) {
      onStartChat(contactId);
    } else {
      alert(`Opening chat with ${contacts.find(c => c.id === contactId)?.name}...`);
    }
  };

  const handleMoreOptions = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(showOptions === contactId ? null : contactId);
  };

  const handleViewProfile = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(null);
    setProfileContact(contact);
  };

  const handleBlockContact = async (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(null);
    setActionError('');

    if (!window.confirm(`Block ${contact.name}? They will be removed from your contacts.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/${contact.id}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to block contact');
      setContacts(prev => prev.filter(c => c.id !== contact.id));
    } catch (err: any) {
      console.error('Block contact error:', err);
      setActionError(err.message || 'Failed to block contact');
    }
  };

  const handleDeleteContact = async (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(null);
    setActionError('');

    if (!window.confirm(`Remove ${contact.name} from your contacts?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/${contact.id}/hide`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove contact');
      setContacts(prev => prev.filter(c => c.id !== contact.id));
    } catch (err: any) {
      console.error('Delete contact error:', err);
      setActionError(err.message || 'Failed to remove contact');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="px-4 pt-16 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Contacts</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

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

      {actionError && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {actionError}
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading contacts...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {filteredContacts.length} Contacts
            </p>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group relative"
              >
                <div className="relative">
                  <img
                    src={getAvatarUrl(contact.name, contact.avatar)}
                    alt={contact.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=7c3aed&color=fff&size=128&bold=true`;
                    }}
                  />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[contact.status]}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    {contact.phone || 'No phone number'}
                  </p>
                  <p className="text-xs text-gray-400">{getStatusLabel(contact.status, contact.lastSeen)}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleMessage(contact.id, e)}
                    className="p-2 hover:bg-purple-50 rounded-full text-purple-600"
                    title="Message"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <button
                    onClick={(e) => handleAudioCall(contact, e)}
                    className="p-2 hover:bg-green-50 rounded-full text-green-600"
                    title="Audio Call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={(e) => handleVideoCall(contact, e)}
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

                    {showOptions === contact.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                        <button
                          onClick={(e) => handleViewProfile(contact, e)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={(e) => handleBlockContact(contact, e)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                        >
                          Block Contact
                        </button>
                        <button
                          onClick={(e) => handleDeleteContact(contact, e)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                        >
                          Delete Contact
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View Profile modal */}
      {profileContact && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setProfileContact(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setProfileContact(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <img
                src={getAvatarUrl(profileContact.name, profileContact.avatar)}
                alt={profileContact.name}
                className="w-24 h-24 rounded-full object-cover mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileContact.name)}&background=7c3aed&color=fff&size=128&bold=true`;
                }}
              />
              <h2 className="text-xl font-bold text-gray-900">{profileContact.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{profileContact.phone || 'No phone number'}</p>
              <p className="text-xs text-gray-400 mt-1">
                {getStatusLabel(profileContact.status, profileContact.lastSeen)}
              </p>

              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={(e) => {
                    handleAudioCall(profileContact, e);
                    setProfileContact(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors"
                >
                  <Phone size={18} /> Call
                </button>
                <button
                  onClick={(e) => {
                    handleMessage(profileContact.id, e);
                    setProfileContact(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition-colors"
                >
                  <MessageCircle size={18} /> Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}