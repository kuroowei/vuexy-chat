import { useState } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Trash2, Smile, Bot } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId?: string;
  onDelete?: (messageId: string) => void;
  onDeleteForMe?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const statusIcons = {
  sent: <Check size={14} />,
  delivered: <CheckCheck size={14} />,
  read: <CheckCheck size={14} className="text-blue-400" />,
};

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ message, isOwn, currentUserId, onDelete, onDeleteForMe, onReact }: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDeleteClick = () => {
    if (isOwn) {
      if (!onDelete) return;
      if (window.confirm('Delete this message? This cannot be undone.')) {
        onDelete(message.id);
      }
    } else {
      if (!onDeleteForMe) return;
      if (window.confirm('Remove this message from your chat? Only visible to you — the other person will still see it.')) {
        onDeleteForMe(message.id);
      }
    }
  };

  const canDelete = isOwn ? !!onDelete : !!onDeleteForMe;

  const DeleteButton = () =>
    canDelete ? (
      <button
        onClick={handleDeleteClick}
        className="text-gray-300 hover:text-red-500 transition-colors"
        title={isOwn ? 'Delete message' : 'Remove from your chat'}
      >
        <Trash2 size={12} />
      </button>
    ) : null;

  const handlePickEmoji = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowPicker(false);
  };

  const ReactButton = () =>
    onReact ? (
      <div className="relative">
        <button
          onClick={() => setShowPicker((prev) => !prev)}
          className="text-gray-300 hover:text-purple-500 transition-colors"
          title="React"
        >
          <Smile size={12} />
        </button>
        {showPicker && (
          <div
            className={
              'absolute bottom-full mb-1.5 bg-white rounded-full shadow-lg border border-gray-100 px-2 py-1.5 flex gap-1.5 z-20 ' +
              (isOwn ? 'right-0' : 'left-0')
            }
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handlePickEmoji(emoji)}
                className="text-base leading-none hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : null;

  const AiBadge = () =>
    message.isAiGenerated ? (
      <span className="flex items-center gap-0.5 text-[10px] text-purple-500 font-medium">
        <Bot size={10} />
        AI
      </span>
    ) : null;

  const reactionCounts = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const myReactionEmoji = currentUserId
    ? (message.reactions || []).find((r) => r.userId === currentUserId)?.emoji
    : undefined;
  const hasReactions = Object.keys(reactionCounts).length > 0;

  const ReactionsRow = () =>
    hasReactions ? (
      <div className={'flex flex-wrap gap-1 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => onReact?.(message.id, emoji)}
            className={
              'text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition-colors ' +
              (myReactionEmoji === emoji
                ? 'bg-purple-50 border-purple-300'
                : 'bg-white border-gray-200 hover:bg-gray-50')
            }
          >
            <span>{emoji}</span>
            {count > 1 && <span className="text-gray-500">{count}</span>}
          </button>
        ))}
      </div>
    ) : null;

  // For image messages
  if (message.type === 'image' && message.fileUrl) {
    return (
      <div className={'flex ' + (isOwn ? 'justify-end' : 'justify-start') + ' mb-3'}>
        <div style={{ maxWidth: '150px' }}>
          <div className={'rounded-xl overflow-hidden shadow-sm ' + (isOwn ? 'rounded-br-sm' : 'rounded-bl-sm')}>
            <img 
              src={message.fileUrl} 
              alt="Shared image" 
              style={{ 
                width: '150px', 
                height: '150px', 
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
          <ReactionsRow />
          <div className={'flex items-center gap-1.5 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
            <DeleteButton />
            <ReactButton />
            <AiBadge />
            <span className="text-[10px] text-gray-400">
              {format(new Date(message.timestamp), 'h:mm a')}
            </span>
            {isOwn && <span className="text-gray-400">{statusIcons[message.status]}</span>}
          </div>
        </div>
      </div>
    );
  }

  // For voice note messages
  if (message.type === 'audio' && message.fileUrl) {
    return (
      <div className={'flex ' + (isOwn ? 'justify-end' : 'justify-start') + ' mb-3'}>
        <div style={{ maxWidth: '280px', width: '100%' }}>
          <div className={'px-3 py-2.5 rounded-xl shadow-sm border ' + (isOwn ? 'bg-purple-600 border-purple-500' : 'bg-white border-gray-100')}>
            <audio controls src={message.fileUrl} style={{ width: '100%', height: '36px' }} />
          </div>
          <ReactionsRow />
          <div className={'flex items-center gap-1.5 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
            <DeleteButton />
            <ReactButton />
            <AiBadge />
            <span className="text-[10px] text-gray-400">
              {format(new Date(message.timestamp), 'h:mm a')}
            </span>
            {isOwn && <span className="text-gray-400">{statusIcons[message.status]}</span>}
          </div>
        </div>
      </div>
    );
  }

  // For file messages
  if (message.type === 'file') {
    return (
      <div className={'flex ' + (isOwn ? 'justify-end' : 'justify-start') + ' mb-3'}>
        <div style={{ maxWidth: '260px', width: '100%' }}>
          <div className={'px-3 py-2.5 rounded-xl shadow-sm border ' + (isOwn ? 'bg-purple-600 text-white rounded-br-sm border-purple-500' : 'bg-white text-gray-800 rounded-bl-sm border-gray-100')}>
            <a href={message.fileUrl} download={message.fileName} className="flex items-center gap-2.5">
              <div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ' + (isOwn ? 'bg-purple-500' : 'bg-purple-100')}>
                <span className={isOwn ? 'text-white' : 'text-purple-600'}>??</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={'text-xs font-medium truncate ' + (isOwn ? 'text-white' : 'text-gray-900')}>{message.fileName || message.content}</p>
                {message.fileSize && (
                  <p className={'text-[10px] ' + (isOwn ? 'text-purple-200' : 'text-gray-500')}>{(message.fileSize / 1024).toFixed(1)} KB</p>
                )}
              </div>
            </a>
          </div>
          <ReactionsRow />
          <div className={'flex items-center gap-1.5 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
            <DeleteButton />
            <ReactButton />
            <AiBadge />
            <span className="text-[10px] text-gray-400">
              {format(new Date(message.timestamp), 'h:mm a')}
            </span>
            {isOwn && <span className="text-gray-400">{statusIcons[message.status]}</span>}
          </div>
        </div>
      </div>
    );
  }

  // Regular text message
  return (
    <div className={'flex ' + (isOwn ? 'justify-end' : 'justify-start') + ' mb-3'}>
      <div style={{ maxWidth: '70%' }}>
        <div
          className={'px-3.5 py-2 rounded-xl text-sm leading-relaxed ' +
            (isOwn
              ? 'bg-purple-600 text-white rounded-br-sm shadow-sm'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100')
          }
        >
          <p>{message.content}</p>
        </div>
        <ReactionsRow />
        <div className={'flex items-center gap-1.5 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
          <DeleteButton />
          <ReactButton />
          <AiBadge />
          <span className="text-[10px] text-gray-400">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          {isOwn && <span className="text-gray-400">{statusIcons[message.status]}</span>}
        </div>
      </div>
    </div>
  );
}