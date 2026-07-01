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
  return (
    <div className={'flex ' + (isOwn ? 'justify-end' : 'justify-start') + ' mb-4'}>
      <div className={'max-w-[75%] ' + (isOwn ? 'order-2' : 'order-1')}>
        <div
          className={'px-4 py-2.5 rounded-2xl text-sm leading-relaxed ' +
            (isOwn
              ? 'bg-purple-600 text-white rounded-br-md shadow-sm'
              : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100')
          }
        >
          {message.type === 'text' ? (
            <p>{message.content}</p>
          ) : message.type === 'image' ? (
            <img src={message.fileUrl} alt="Shared" className="rounded-lg max-w-full" />
          ) : (
            <a href={message.fileUrl} className="flex items-center gap-2 underline">
              <span>📎</span>
              {message.content}
            </a>
          )}
        </div>
        <div className={'flex items-center gap-1 mt-1 ' + (isOwn ? 'justify-end' : 'justify-start')}>
          <span className="text-[11px] text-gray-400">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          {isOwn && <span className="text-gray-400">{statusIcons[message.status]}</span>}
        </div>
      </div>
    </div>
  );
}
