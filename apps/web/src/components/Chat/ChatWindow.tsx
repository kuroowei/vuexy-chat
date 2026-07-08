import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone, Video, Search, MoreVertical } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EmptyState from './EmptyState';
import type { Message, Contact } from '@/types';

const mockMessages: Record<string, Message[]> = {
  '2': [
    { id: 'm1', conversationId: 'c2', senderId: 'u2', recipientId: 'me', content: 'Hello. How can I help You?', type: 'text', status: 'read', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'm2', conversationId: 'c2', senderId: 'me', recipientId: 'u2', content: 'Can I get details of my last transaction I made last month?', type: 'text', status: 'read', timestamp: new Date(Date.now() - 3300000).toISOString() },
    { id: 'm3', conversationId: 'c2', senderId: 'u2', recipientId: 'me', content: 'We need to check if we can provide you such information.', type: 'text', status: 'read', timestamp: new Date(Date.now() - 3000000).toISOString() },
    { id: 'm4', conversationId: 'c2', senderId: 'u2', recipientId: 'me', content: 'I will inform you as I get update on this.', type: 'text', status: 'read', timestamp: new Date(Date.now() - 3000000).toISOString() },
    { id: 'm5', conversationId: 'c2', senderId: 'me', recipientId: 'u2', content: 'If it takes long you can mail me at my mail address.', type: 'text', status: 'read', timestamp: new Date(Date.now() - 1800000).toISOString() },
  ],
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

  const contact: Contact | undefined = contactId ? {
    id: contactId, userId: 'u' + contactId, name: contactId === '2' ? 'Harriet McBride' : 'User',
    avatar: 'https://i.pravatar.cc/150?img=' + contactId, status: 'online', lastMessage: '',
    lastMessageTime: new Date().toISOString(), unreadCount: 0,
  } : undefined;

  useEffect(() => {
    if (contactId && mockMessages[contactId]) setMessages(mockMessages[contactId]);
    else setMessages([]);
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
    
    // Simulate reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const reply: Message = {
          id: 'reply-' + Date.now(), 
          conversationId: 'c' + contactId, 
          senderId: 'u' + contactId, 
          recipientId: 'me',
          content: 'Thanks for your message! I will get back to you shortly.', 
          type: 'text', 
          status: 'sent',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, reply]);
      }, 2000);
    }, 1000);
  };

  if (!contactId) return <EmptyState />;

  return (
    <div className={'flex flex-col bg-white ' + (className || '')}>
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="relative flex-shrink-0">
            <img src={contact?.avatar} alt={contact?.name} className="w-9 h-9 rounded-full object-cover" />
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
