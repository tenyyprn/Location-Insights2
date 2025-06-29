/**
 * チャットメッセージコンポーネント
 */
import React from 'react';
import { ChatMessageProps } from '../../types/chat';

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return '📢';
      default:
        return '💬';
    }
  };

  const getMessageStyle = (role: string) => {
    const baseStyle = {
      maxWidth: '80%',
      padding: '12px 16px',
      borderRadius: '18px',
      position: 'relative' as const,
      wordWrap: 'break-word' as const,
      lineHeight: '1.4',
      fontSize: '14px'
    };

    switch (role) {
      case 'user':
        return {
          ...baseStyle,
          alignSelf: 'flex-end' as const,
          background: 'linear-gradient(135deg, #007bff, #0056b3)',
          color: 'white',
          borderBottomRightRadius: '4px'
        };
      case 'assistant':
        return {
          ...baseStyle,
          alignSelf: 'flex-start' as const,
          background: '#f1f3f4',
          color: '#333',
          borderBottomLeftRadius: '4px'
        };
      case 'system':
        return {
          ...baseStyle,
          alignSelf: 'center' as const,
          background: '#e3f2fd',
          color: '#1565c0',
          fontSize: '12px',
          maxWidth: '90%',
          textAlign: 'center' as const
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: message.role === 'user' ? 'flex-end' : message.role === 'system' ? 'center' : 'flex-start',
      marginBottom: '12px'
    }}>
      <div style={getMessageStyle(message.role)}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>
            {getMessageIcon(message.role)}
          </span>
          <div style={{ flex: 1 }}>
            {message.content}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: '11px',
        color: '#666',
        marginTop: '4px',
        marginLeft: message.role === 'user' ? '0' : '24px',
        marginRight: message.role === 'user' ? '24px' : '0'
      }}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

export default ChatMessage;
