/**
 * チャット入力コンポーネント
 */
import React, { useState, KeyboardEvent } from 'react';
import { ChatInputProps } from '../../types/chat';

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled, 
  placeholder = "メッセージを入力..." 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      padding: '16px',
      background: '#f8f9fa',
      borderTop: '1px solid #e9ecef',
      gap: '8px'
    }}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '12px 16px',
          border: '1px solid #ddd',
          borderRadius: '24px',
          outline: 'none',
          fontSize: '14px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          color: disabled ? '#999' : '#333'
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !inputValue.trim()}
        style={{
          background: disabled || !inputValue.trim() 
            ? '#ccc' 
            : 'linear-gradient(135deg, #007bff, #0056b3)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '24px',
          cursor: disabled || !inputValue.trim() ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          minWidth: '80px',
          transition: 'all 0.2s ease'
        }}
      >
        {disabled ? '接続中...' : '送信'}
      </button>
    </div>
  );
};

export default ChatInput;
