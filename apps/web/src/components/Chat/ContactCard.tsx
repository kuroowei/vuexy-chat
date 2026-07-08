import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import StatusIndicator from '../UI/StatusIndicator';
import type { Contact } from '@/types';

interface ContactCardProps {
  contact: Contact;
  isActive: boolean;
  onClick: () => void;
}

export default function ContactCard({ contact, isActive, onClick }: ContactCardProps) {
  const [imgError, setImgError] = useState(false);

  // Generate fallback avatar if image fails to load
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=7c3aed&color=fff&size=128&bold=true`;

  return (
    <button
      onClick={onClick}
      className={'w-full px-4 py-3 flex items-start gap-3 transition-all duration-200 ' +
        (isActive ? 'bg-purple-50 border-l-4 border-purple-600' : 'hover:bg-gray-50 border-l-4 border-transparent')
      }
    >
      <div className="relative flex-shrink-0">
        <img
          src={imgError ? fallbackAvatar : contact.avatar}
          alt={contact.name}
          className="w-10 h-10 rounded-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <StatusIndicator status={contact.status} className="absolute bottom-0 right-0" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className={'text-sm font-medium truncate ' + (isActive ? 'text-purple-900' : 'text-gray-900')}>
            {contact.name}
          </h4>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {contact.lastMessageTime && formatDistanceToNow(new Date(contact.lastMessageTime), { addSuffix: false })}
          </span>
        </div>
        <p className={'text-xs truncate ' +
          (contact.isTyping ? 'text-purple-600 italic font-medium' : contact.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500')
        }>
          {contact.isTyping ? 'typing...' : contact.lastMessage}
        </p>
      </div>
      {contact.unreadCount > 0 && (
        <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center mt-0.5">
          {contact.unreadCount}
        </span>
      )}
    </button>
  );
}
