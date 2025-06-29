/**
 * タイピングインジケーターコンポーネント
 */
import React from 'react';
import { TypingIndicatorProps } from '../../types/chat';

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '12px'
    }}>
      <div style={{
        maxWidth: '80%',
        padding: '12px 16px',
        borderRadius: '18px',
        background: '#f1f3f4',
        color: '#333',
        borderBottomLeftRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '16px' }}>🤖</span>
        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '8px', fontSize: '14px' }}>入力中</span>
          <div style={{
            display: 'flex',
            gap: '3px'
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#999',
                  animation: `typing 1.4s infinite ease-in-out`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes typing {
            0%, 60%, 100% { 
              transform: translateY(0);
              opacity: 0.4;
            }
            30% { 
              transform: translateY(-8px);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default TypingIndicator;
