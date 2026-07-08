import { useState, useRef, useCallback } from 'react';
import { Paperclip, Smile, Send, Mic, X, FileText, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string, type?: 'text' | 'image' | 'file', fileData?: { name: string; url: string; size?: number }) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File; preview?: string; type: 'image' | 'file' } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTyping = useCallback(() => {
    onTyping?.(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 2000);
  }, [onTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (selectedFile) {
      // Send file message
      const fileData = {
        name: selectedFile.file.name,
        url: selectedFile.preview || URL.createObjectURL(selectedFile.file),
        size: selectedFile.file.size,
      };
      onSend(selectedFile.file.name, selectedFile.type, fileData);
      setSelectedFile(null);
      return;
    }

    if (!message.trim()) return;
    onSend(message.trim(), 'text');
    setMessage('');
    onTyping?.(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : undefined;

    setSelectedFile({
      file,
      preview,
      type: isImage ? 'image' : 'file',
    });

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
          {selectedFile.type === 'image' && selectedFile.preview ? (
            <img src={selectedFile.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-purple-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.file.size)}</p>
          </div>
          <button 
            onClick={clearSelectedFile}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File Upload Button */}
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-lg transition-colors ${
            selectedFile ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Input Area */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full">
            <Smile size={18} />
          </button>
        </div>

        {/* Send or Record Button */}
        {message.trim() || selectedFile ? (
          <button type="submit" className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
            <Send size={18} />
          </button>
        ) : (
          <button 
            type="button" 
            onClick={() => setIsRecording(!isRecording)} 
            className={'p-2.5 rounded-full transition-colors ' + (isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            <Mic size={18} />
          </button>
        )}
      </form>
    </div>
  );
}
