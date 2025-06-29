/**
 * チャット機能の型定義
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  message_id?: string;
}

export interface ChatContext {
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  lifestyle_scores?: {
    total_score: number;
    breakdown: Record<string, number>;
  };
  recent_analysis?: any;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'system' | 'error' | 'context_update' | 'ping' | 'pong' | 'context_updated';
  content?: string;
  role?: 'user' | 'assistant' | 'system';
  timestamp?: string;
  message_id?: string;
  is_typing?: boolean;
  context?: ChatContext;
}

export interface ChatSession {
  session_id: string;
  messages: ChatMessage[];
  context: ChatContext;
  connected: boolean;
}

export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export interface ChatMessageProps {
  message: ChatMessage;
}

export interface TypingIndicatorProps {
  show: boolean;
}
