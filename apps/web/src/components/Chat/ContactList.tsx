import { useState, useMemo, useEffect, useRef } from 'react';
import { Phone, Video, Search, MoreVertical, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ContactCard from './ContactCard';
import SearchBar from '../UI/SearchBar';
import type { Contact } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

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

interface ContactListProps {
  onSelectContact: (id: string) => void;
  activeContact: string | null;
  onStartCall?: (contactId: string, contactName: string, contactAvatar: string, type: 'audio' | 'video') => void;
  className?: string;
}

export default function ContactList({ onSelectContact, activeContact, onStartCall, className }: ContactListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        const mappedContacts: Contact[] = data.users.map((user: any) => ({
          id: user.id,
          userId: user.userId,
          name: user.name,
          avatar: getAvatarUrl(user.name, user.avatar),
          status: user.status || 'offline',
          lastMessage: '',
          lastMessageTime: user.lastSeen || new Date().toISOString(),
          unreadCount: 0,
        }));
        setContacts(mappedContacts);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }, [contacts, searchQuery]);

  const remainingContacts = useMemo(() => contacts.slice(2), [contacts]);

  const activeContactData = useMemo(
    () => contacts.find((c) => c.id === activeContact),
    [contacts, activeContact]
  );

  const handleAudioCall = () => {
    if (!activeContactData) {
      alert('Select a chat first to start a call.');
      return;
    }
    onStartCall?.(activeContactData.id, activeContactData.name, activeContactData.avatar, 'audio');
  };

  const handleVideoCall = () => {
    if (!activeContactData) {
      alert('Select a chat first to start a call.');
      return;
    }
    onStartCall?.(activeContactData.id, activeContactData.name, activeContactData.avatar, 'video');
  };

  const handleFocusSearch = () => {
    const input = searchWrapperRef.current?.querySelector('input');
    input?.focus();
  };

  const handleRefresh = () => {
    setShowMenu(false);
    setLoading(true);
    fetchUsers();
  };

  const handleGoToSettings = () => {
    setShowMenu(false);
    navigate('/settings');
  };

  if (loading) {
    return (
      <div className={'bg-white border-r border-gray-200 flex flex-col items-center justify-center ' + (className || '')}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className={'bg-white border-r border-gray-200 flex flex-col ' + (className || '')}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
          <div className="flex gap-1">
            <button onClick={handleAudioCall} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Call selected contact"><Phone size={18} /></button>
            <button onClick={handleVideoCall} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Video call selected contact"><Video size={18} /></button>
            <button onClick={handleFocusSearch} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Search"><Search size={18} /></button>
            <div className="relative">
              <button onClick={() => setShowMenu((prev) => !prev)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="More">
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                  <button
                    onClick={handleRefresh}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                  >
                    <RefreshCw size={15} /> Refresh Contacts
                  </button>
                  <button
                    onClick={handleGoToSettings}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                  >
                    <Settings size={15} /> Go to Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div ref={searchWrapperRef}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search contact or message..." />
        </div>
      </div>

      {/* Single scrollable region covering both Chats and Contacts */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chats</h3>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center"><p className="text-sm text-gray-500">No contacts found</p></div>
        ) : (
          filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} isActive={activeContact === contact.id} onClick={() => onSelectContact(contact.id)} />
          ))
        )}

        {remainingContacts.length > 0 && (
          <>
            <div className="px-4 pt-4 pb-2 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacts</h3>
            </div>
            {remainingContacts.map((contact) => (
              <ContactCard key={'contact-' + contact.id} contact={contact} isActive={activeContact === contact.id} onClick={() => onSelectContact(contact.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}