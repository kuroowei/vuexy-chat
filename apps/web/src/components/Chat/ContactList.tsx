import { useState, useMemo, useEffect } from 'react';
import { Phone, Video, Search, MoreVertical } from 'lucide-react';
import ContactCard from './ContactCard';
import SearchBar from '../UI/SearchBar';
import type { Contact } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

// Helper to generate initials avatar URL, and correctly resolve real avatar paths
const getAvatarUrl = (name: string, existingAvatar: string): string => {
  if (existingAvatar && existingAvatar.trim() !== '') {
    // Already a full URL or a data URL — use as-is
    if (existingAvatar.startsWith('http') || existingAvatar.startsWith('data:')) {
      return existingAvatar;
    }
    // Relative path from backend (e.g. "/uploads/avatar-123.jpg") — prepend backend origin
    if (existingAvatar.startsWith('/')) {
      return `${BACKEND_URL}${existingAvatar}`;
    }
    // Bare relative path without leading slash
    return `${BACKEND_URL}/${existingAvatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128&bold=true`;
};

interface ContactListProps {
  onSelectContact: (id: string) => void;
  activeContact: string | null;
  className?: string;
}

export default function ContactList({ onSelectContact, activeContact, className }: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // IMPORTANT: must match the key AuthContext.tsx uses ('token'), not 'authToken'
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
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Phone size={18} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Video size={18} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Search size={18} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><MoreVertical size={18} /></button>
          </div>
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search contact or message..." />
      </div>

      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chats</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center"><p className="text-sm text-gray-500">No contacts found</p></div>
        ) : (
          filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} isActive={activeContact === contact.id} onClick={() => onSelectContact(contact.id)} />
          ))
        )}
      </div>

      <div className="px-4 pt-4 pb-2 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacts</h3>
      </div>
      <div className="overflow-y-auto max-h-48">
        {contacts.slice(2).map((contact) => (
          <ContactCard key={'contact-' + contact.id} contact={contact} isActive={activeContact === contact.id} onClick={() => onSelectContact(contact.id)} />
        ))}
      </div>
    </div>
  );
}