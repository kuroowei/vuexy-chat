import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, Video, Search, MoreVertical, X, ShieldOff, Trash2, User } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import { useCall } from '@/contexts/CallContext';
import type { Message, Contact } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const BACKEND_URL = API_BASE.replace('/api', '');

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

interface ChatWindowProps {
  contactId: string | null;
  onBack: () => void;
  className?: string;
}

export default function ChatWindow({ contactId, onBack, className }: ChatWindowProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { startCall } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [contact, setContact] = useState<Contact | undefined>();
  const [headerImgError, setHeaderImgError] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [actionError, setActionError] = useState('');

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
          headers: { Authorization: `Bearer ${token}` },
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

  // Fetch real message history for this conversation
  useEffect(() => {
    if (!contactId) {
      setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/messages/${contactId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const mapped: Message[] = (data.messages || []).map((m: any) => ({
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            recipientId: m.recipientId,
            content: m.content,
            type: m.type,
            status: m.status,
            timestamp: m.createdAt,
            fileUrl: m.fileUrl,
          }));
          setMessages(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch message history:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchHistory();
  }, [contactId]);

  // Real-time: receive new messages, typing indicators, and status changes
  useEffect(() => {
    if (!socket || !contactId) return;

    const handleNewMessage = (payload: any) => {
      const belongsHere =
        (payload.senderId === contactId && payload.recipientId === user?.id) ||
        (payload.senderId === user?.id && payload.recipientId === contactId);
      if (!belongsHere) return;

      const incoming: Message = {
        id: payload.id,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        content: payload.content,
        type: payload.type,
        status: payload.status,
        timestamp: payload.createdAt,
        fileUrl: payload.fileUrl,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    };

    const handleTypingEvent = ({ userId: fromUserId, isTyping: typingState }: any) => {
      if (fromUserId === contactId) {
        setIsTyping(typingState);
      }
    };

    const handleStatusChange = ({ userId: changedUserId, status }: any) => {
      if (changedUserId !== contactId) return;
      setContact((prev) => (prev ? { ...prev, status } : prev));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('user:status', handleStatusChange);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('user:status', handleStatusChange);
    };
  }, [socket, contactId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showSearch]);

  const handleSend = (content: string, type: 'text' | 'image' | 'file' = 'text', fileData?: { name: string; url: string; size?: number }) => {
    if (!socket || !contactId || !user) return;

    socket.emit('send_message', {
      recipientId: contactId,
      content,
      type,
      fileUrl: fileData?.url,
    });
  };

  const handleTyping = (typing: boolean) => {
    if (!socket || !contactId) return;
    socket.emit('typing', { contactId, isTyping: typing });
  };

  const handleAudioCall = () => {
    if (!contact) return;
    startCall(contact.id, contact.name, contact.avatar, 'audio');
  };

  const handleVideoCall = () => {
    if (!contact) return;
    startCall(contact.id, contact.name, contact.avatar, 'video');
  };

  const handleBlockContact = async () => {
    if (!contact || !contactId) return;
    setShowMenu(false);
    if (!window.confirm(`Block ${contact.name}? They will be removed from your contacts.`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users/${contactId}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to block contact');
      onBack();
    } catch (err: any) {
      console.error('Block contact error:', err);
      setActionError(err.message || 'Failed to block contact');
    }
  };

  const handleClearChat = async () => {
    if (!contactId) return;
    setShowMenu(false);
    if (!window.confirm('Clear all messages in this conversation? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/messages/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to clear conversation');
      setMessages([]);
    } catch (err: any) {
      console.error('Clear chat error:', err);
      setActionError(err.message || 'Failed to clear conversation');
    }
  };

  if (!contactId) return <EmptyState />;

  const headerAvatar = headerImgError
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=7c3aed&color=fff&size=128&bold=true`
    : contact?.avatar;

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className={'flex flex-col bg-white relative ' + (className || '')}>
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <button
            className="flex items-center gap-3 min-w-0"
            onClick={() => setShowProfile(true)}
          >
            <div className="relative flex-shrink-0">
              <img
                src={headerAvatar}
                alt={contact?.name}
                className="w-9 h-9 rounded-full object-cover"
                onError={() => setHeaderImgError(true)}
              />
              <span className={'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ' + (contact?.status === 'online' ? 'bg-green-500' : 'bg-gray-400')} />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{contact?.name}</h3>
              <p className="text-xs text-gray-500">{isTyping ? <span className="text-purple-600 font-medium">typing...</span> : contact?.status === 'online' ? 'Online' : 'Offline'}</p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handleAudioCall} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Voice call"><Phone size={18} /></button>
          <button onClick={handleVideoCall} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Video call"><Video size={18} /></button>
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-100 text-gray-500'}`}
            title="Search in conversation"
          >
            <Search size={18} />
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu((prev) => !prev)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="More">
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                <button
                  onClick={() => { setShowMenu(false); setShowProfile(true); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                >
                  <User size={15} /> View Contact
                </button>
                <button
                  onClick={handleClearChat}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                >
                  <Trash2 size={15} /> Clear Chat
                </button>
                <button
                  onClick={handleBlockContact}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                >
                  <ShieldOff size={15} /> Block Contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this conversation..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {actionError}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-1">
          {loadingMessages && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          )}

          {!loadingMessages && filteredMessages.length === 0 && (
            <div className="flex justify-center py-8">
              <p className="text-sm text-gray-400">
                {searchQuery.trim() ? 'No matching messages' : 'No messages yet. Say hello!'}
              </p>
            </div>
          )}

          {filteredMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
          ))}

          {/* Typing indicator */}
          {!searchQuery.trim() && isTyping && (
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
      <ChatInput onSend={handleSend} onTyping={handleTyping} />

      {/* View Contact modal */}
      {showProfile && contact && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center text-center">
              <img
                src={headerAvatar}
                alt={contact.name}
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
              <h2 className="text-xl font-bold text-gray-900">{contact.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{contact.status === 'online' ? 'Online' : 'Offline'}</p>
              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={() => { handleAudioCall(); setShowProfile(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors"
                >
                  <Phone size={18} /> Call
                </button>
                <button
                  onClick={() => { handleVideoCall(); setShowProfile(false); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition-colors"
                >
                  <Video size={18} /> Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}