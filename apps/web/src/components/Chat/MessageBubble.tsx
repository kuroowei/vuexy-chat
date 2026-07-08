import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const statusIcons = {
  sent: <Check size={14} />,
  delivered: <CheckCheck size={14} />,
  read: <CheckCheck size={14} className="text-blue-400" />,
};

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
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
          <div className={'flex items-center gap-1 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
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
          <div className={'flex items-center gap-1 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
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
        <div className={'flex items-center gap-1 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
          <span className="text-[10px] text-gray-400">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          {isOwn && <span className="text-gray-400">{statusIcons[message.status]}</span>}
        </div>
      </div>
    </div>
  );
}
