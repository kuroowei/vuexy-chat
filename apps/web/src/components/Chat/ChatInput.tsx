import { useState, useRef, useCallback } from 'react';
import { Paperclip, Smile, Send, Mic } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTyping = useCallback(() => {
    onTyping?.(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 2000);
  }, [onTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
    onTyping?.(false);
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button type="button" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Paperclip size={20} />
        </button>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            placeholder="Type a message..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full">
            <Smile size={18} />
          </button>
        </div>
        {message.trim() ? (
          <button type="submit" className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
            <Send size={18} />
          </button>
        ) : (
          <button type="button" onClick={() => setIsRecording(!isRecording)} className={'p-2.5 rounded-full transition-colors ' + (isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            <Mic size={18} />
          </button>
        )}
      </form>
    </div>
  );
}
