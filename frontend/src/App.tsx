import React, { useState } from 'react';
import { AddressProvider, useAddress } from './context/AddressContext';
import LifestyleScoreAnalysis from './components/LifestyleScoreAnalysis';
import DisasterWarningInfo from './components/DisasterWarningInfo';
import EnhancedLifestyleAnalysis from './components/EnhancedLifestyleAnalysis';
import IntegratedHomeScreen from './components/IntegratedHomeScreen';
// 🆕 チャット機能のインポート
import FloatingChatButton from './components/chat/FloatingChatButton';
import { ChatContext } from './types/chat';

type ViewType = 'home' | 'lifestyle' | 'disaster' | 'ai-analysis';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'lifestyle':
        return <LifestyleScoreAnalysis onViewChange={setCurrentView} />;
      case 'disaster':
        return <DisasterWarningInfo />;
      case 'ai-analysis':
        return <EnhancedLifestyleAnalysis />;
      default:
        return <IntegratedHomeScreen onViewChange={setCurrentView} />;
    }
  };

  const MainApp = () => {
    const { currentAddress, coordinates } = useAddress();
    
    // 🆕 チャット用コンテキストを構築
    const chatContext: ChatContext = {
      address: currentAddress || undefined,
      coordinates: coordinates || undefined
    };
    
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        {/* ナビゲーション */}
        <nav style={{
          background: 'white',
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'sticky' as const,
          top: 0,
          zIndex: 1000
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap' as const,
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '20px',
              fontWeight: 600,
              color: '#333'
            }}>
              🏠 Location Insights
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
              <button
                onClick={() => setCurrentView('home')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: currentView === 'home' ? '#6366f1' : 'transparent',
                  color: currentView === 'home' ? 'white' : '#333',
                  fontWeight: 600,
                  boxShadow: currentView === 'home' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (currentView !== 'home') {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== 'home') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                🏠 ホーム
              </button>
              
              <button
                onClick={() => setCurrentView('disaster')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: currentView === 'disaster' ? '#ef4444' : 'transparent',
                  color: currentView === 'disaster' ? 'white' : '#333',
                  fontWeight: 600,
                  boxShadow: currentView === 'disaster' ? '0 4px 12px rgba(239, 68, 68, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (currentView !== 'disaster') {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== 'disaster') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                ⚠️ 災害情報
              </button>
            </div>
          </div>
        </nav>

        {/* コンテンツ */}
        <main style={{ padding: '0' }}>
          {renderCurrentView()}
        </main>

        {/* フッター */}
        <footer style={{
          background: '#2c3e50',
          color: 'white',
          textAlign: 'center' as const,
          padding: '20px',
          marginTop: '40px'
        }}>
          <p style={{ margin: 0 }}>
            © 2024 Location Insights - 地域情報システム
          </p>
        </footer>
        
        {/* 🆕 フローティングチャットボタン */}
        <FloatingChatButton context={chatContext} />
      </div>
    );
  };

  return (
    <AddressProvider>
      <MainApp />
    </AddressProvider>
  );
};

export default App;