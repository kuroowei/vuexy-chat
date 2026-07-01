import { useState, useMemo } from 'react';
import { Phone, Video, Search, MoreVertical } from 'lucide-react';
import ContactCard from './ContactCard';
import SearchBar from '../UI/SearchBar';
import type { Contact } from '@/types';

const mockContacts: Contact[] = [
  {
    id: '1', userId: 'u1', name: 'Gavin Griffith', avatar: 'https://i.pravatar.cc/150?img=12',
    status: 'online', lastMessage: 'I will purchase it for sure.',
    lastMessageTime: new Date(Date.now() - 86400000).toISOString(), unreadCount: 1,
  },
  {
    id: '2', userId: 'u2', name: 'Harriet McBride', avatar: 'https://i.pravatar.cc/150?img=5',
    status: 'online', lastMessage: 'If it takes long you can mail me at my mail address.',
    lastMessageTime: new Date(Date.now() - 172800000).toISOString(), unreadCount: 0, isTyping: false,
  },
  {
    id: '3', userId: 'u3', name: 'Danny Conner', avatar: 'https://i.pravatar.cc/150?img=3',
    status: 'offline', lastMessage: 'Souffle souffle caramels sweet roll. Jelly I...',
    lastMessageTime: new Date(Date.now() - 259200000).toISOString(), unreadCount: 0,
  },
  {
    id: '4', userId: 'u4', name: 'Janie West', avatar: 'https://i.pravatar.cc/150?img=9',
    status: 'away', lastMessage: 'Chupa chups candy canes chocolate bar...',
    lastMessageTime: new Date(Date.now() - 345600000).toISOString(), unreadCount: 0,
  },
  {
    id: '5', userId: 'u5', name: 'Bryan Murray', avatar: 'https://i.pravatar.cc/150?img=13',
    status: 'online', lastMessage: 'Cake pie jelly jelly beans. Marzipan lemon...',
    lastMessageTime: new Date(Date.now() - 432000000).toISOString(), unreadCount: 0,
  },
];

interface ContactListProps {
  onSelectContact: (id: string) => void;
  activeContact: string | null;
  className?: string;
}

export default function ContactList({ onSelectContact, activeContact, className }: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = useMemo(() => {
    return mockContacts
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }, [searchQuery]);

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
        {mockContacts.slice(2).map((contact) => (
          <ContactCard key={'contact-' + contact.id} contact={contact} isActive={activeContact === contact.id} onClick={() => onSelectContact(contact.id)} />
        ))}
      </div>
    </div>
  );
}
