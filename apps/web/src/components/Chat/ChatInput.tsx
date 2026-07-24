import { useState, useRef, useCallback, useEffect } from 'react';
import { Paperclip, Smile, Send, Mic, Square, X, FileText, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

interface ChatInputProps {
  onSend: (content: string, type?: 'text' | 'image' | 'file' | 'audio', fileData?: { name: string; url: string; size?: number }) => void;
  onTyping?: (isTyping: boolean) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onTyping, onRecordingChange, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingVoiceNote, setIsUploadingVoiceNote] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedFile, setSelectedFile] = useState<{ file: File; preview?: string; type: 'image' | 'file' } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup: if this component unmounts mid-recording, release the mic
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleTyping = useCallback(() => {
    onTyping?.(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 2000);
  }, [onTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (selectedFile) {
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

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const uploadVoiceNote = async (blob: Blob): Promise<string | null> => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio', blob, `voice-note-${Date.now()}.webm`);

      const res = await fetch(`${API_URL}/messages/upload-voice-note`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      return data.url;
    } catch (error) {
      console.error('Voice note upload error:', error);
      alert('Could not send voice note. Please try again.');
      return null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        // Ignore accidental near-zero-length recordings (e.g. a stray click)
        if (audioBlob.size < 500) return;

        setIsUploadingVoiceNote(true);
        const url = await uploadVoiceNote(audioBlob);
        setIsUploadingVoiceNote(false);

        if (url) {
          onSend('Voice message', 'audio', { name: 'voice-note.webm', url, size: audioBlob.size });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingChange?.(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Could not access your microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    onRecordingChange?.(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingSeconds(0);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
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

      {isRecording && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-600">Recording {formatDuration(recordingSeconds)}</span>
          <span className="text-xs text-red-400 ml-auto">Tap the mic again to stop and send</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording}
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

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            placeholder={selectedFile ? 'Add a caption...' : isRecording ? 'Recording voice message...' : 'Type a message...'}
            disabled={isRecording}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10 disabled:opacity-60"
          />
          <button type="button" disabled={isRecording} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full">
            <Smile size={18} />
          </button>
        </div>

        {message.trim() || selectedFile ? (
          <button type="submit" className="p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isUploadingVoiceNote}
            className={'p-2.5 rounded-full transition-colors ' + (isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
      </form>
    </div>
  );
}