import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, Video, Search, MoreVertical } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';
import type { Message, Contact } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Helper to generate initials avatar URL
const getAvatarUrl = (name: string, existingAvatar: string): string => {
  if (existingAvatar && existingAvatar.trim() !== '') {
    return existingAvatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128&bold=true`;
};

interface ChatWindowProps {
  contactId: string | null;
  onBack: () => void;
  className?: string;
}

export default function ChatWindow({ contactId, onBack, className }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [contact, setContact] = useState<Contact | undefined>();
  const [headerImgError, setHeaderImgError] = useState(false);

  // Fetch real contact data
  useEffect(() => {
    if (!contactId) {
      setContact(undefined);
      return;
    }

    const fetchContact = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/users/${contactId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.id) {
          setContact({
            id: data.id,
            userId: data.userId,
            name: data.name,
            avatar: getAvatarUrl(data.name, data.avatar),
            status: data.status || 'offline',
            lastMessage: '',
            lastMessageTime: data.lastSeen || new Date().toISOString(),
            unreadCount: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch contact:', error);
      }
    };

    fetchContact();
  }, [contactId]);

  // NOTE: message history is not yet persisted anywhere — starts empty
  // for every conversation until real message storage/retrieval is built.
  useEffect(() => {
    setMessages([]);
  }, [contactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (content: string, type: 'text' | 'image' | 'file' = 'text', fileData?: { name: string; url: string; size?: number }) => {
    const newMessage: Message = {
      id: 'new-' + Date.now(),
      conversationId: 'c' + contactId,
      senderId: 'me',
      recipientId: 'u' + contactId,
      content,
      type,
      status: 'sent',
      timestamp: new Date().toISOString(),
      fileName: fileData?.name,
      fileUrl: fileData?.url,
      fileSize: fileData?.size,
    };
    setMessages((prev) => [...prev, newMessage]);

    // NOTE: no real delivery yet — this message currently only exists in
    // this browser tab's local state and is never actually sent to the
    // recipient. Real sending/receiving (via Socket.io + a Message model)
    // is a separate feature still to be built.
  };

  if (!contactId) return <EmptyState />;

  const headerAvatar = headerImgError
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=7c3aed&color=fff&size=128&bold=true`
    : contact?.avatar;

  return (
    <div className={'flex flex-col bg-white ' + (className || '')}>
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="relative flex-shrink-0">
            <img
              src={headerAvatar}
              alt={contact?.name}
              className="w-9 h-9 rounded-full object-cover"
              onError={() => setHeaderImgError(true)}
            />
            <span className={'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ' + (contact?.status === 'online' ? 'bg-green-500' : 'bg-gray-400')} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{contact?.name}</h3>
            <p className="text-xs text-gray-500">{isTyping ? <span className="text-purple-600 font-medium">typing...</span> : contact?.status === 'online' ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Phone size={18} /></button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Video size={18} /></button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Search size={18} /></button>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-1">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === 'me'} />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay:'0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay:'150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay:'300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}