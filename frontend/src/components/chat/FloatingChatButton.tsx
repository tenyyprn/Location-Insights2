/**
 * フローティングチャットボタンコンポーネント
 */
import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { ChatContext } from '../../types/chat';

interface FloatingChatButtonProps {
  context?: ChatContext;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ context }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* フローティングボタン */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999
        }}
      >
        <button
          onClick={() => setIsChatOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            background: isHovered 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #007bff, #0056b3)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 123, 255, 0.4)',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="AIチャットを開く"
        >
          💬
        </button>
        
        {/* ツールチップ */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            bottom: '70px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            right: '50%',
            transform: 'translateX(50%)'
          }}>
            Location Insights AI
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(0, 0, 0, 0.8)'
            }} />
          </div>
        )}
      </div>

      {/* チャットウィンドウ */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={context}
      />
    </>
  );
};

export default FloatingChatButton;
