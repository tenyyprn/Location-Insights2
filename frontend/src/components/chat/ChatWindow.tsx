/**
 * メインチャットウィンドウコンポーネント
 */
import React, { useEffect, useRef } from 'react';
import { ChatWindowProps } from '../../types/chat';
import { useWebSocketChat } from '../../hooks/useWebSocket';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, context }) => {
  // セッションIDを一度だけ生成し、再レンダリングで変更されないようにする
  const sessionIdRef = useRef('session_' + Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isConnected,
    isTyping,
    connectionError,
    sendMessage,
    updateContext,
    clearMessages
  } = useWebSocketChat(sessionIdRef.current, context);

  // メッセージエリアを最下部にスクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // コンテキストが変更された時の処理
  useEffect(() => {
    if (context && isConnected) {
      updateContext(context);
    }
  }, [context, isConnected, updateContext]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '90%',
        maxWidth: '600px',
        height: '80%',
        maxHeight: '700px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* チャットヘッダー */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              🤖 Location Insights AI
            </h3>
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.9, 
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#4caf50' : '#f44336'
              }} />
              {isConnected ? '接続中' : connectionError || '切断'}
              {context?.address && (
                <span style={{ marginLeft: '8px' }}>
                  📍 {context.address}
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={clearMessages}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="履歴をクリア"
            >
              🗑️
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="チャットを閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {connectionError && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px 16px',
            fontSize: '14px',
            borderBottom: '1px solid #ffcdd2'
          }}>
            ⚠️ {connectionError}
          </div>
        )}

        {/* メッセージエリア */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {messages.length === 0 && isConnected && (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '40px 20px',
                fontSize: '14px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
                <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                  Location Insights AIへようこそ！
                </div>
                <div>
                  地域の住環境や生活利便性について、お気軽にご質問ください。
                </div>
                {context?.address && (
                  <div style={{ 
                    marginTop: '16px',
                    padding: '12px',
                    background: '#f0f7ff',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    現在、<strong>{context.address}</strong>について分析中です
                  </div>
                )}
              </div>
            )}
            
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            <TypingIndicator show={isTyping} />
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 入力エリア */}
        <ChatInput
          onSendMessage={sendMessage}
          disabled={!isConnected}
          placeholder={isConnected ? "メッセージを入力..." : "接続を待機中..."}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
