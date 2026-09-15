export interface Reaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio';
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  reactions?: Reaction[];
  isAiGenerated?: boolean;
}

export interface Contact {
  id: string;
  userId?: string;
  name: string;
  avatar: string;
  phone?: string;
  status: 'online' | 'offline';
  lastMessage: string;
  lastMessageTime: string;
  lastSeen?: string;
  unreadCount: number;
  isTyping?: boolean;
  friendStatus?: 'none' | 'pending_sent' | 'pending_received';
}
