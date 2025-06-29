import React, { useState } from 'react';
import { useAddress } from '../context/AddressContext';

type ViewType = 'home' | 'lifestyle' | 'disaster' | 'ai-analysis';

interface IntegratedHomeScreenProps {
  onViewChange: (view: ViewType) => void;
}

const IntegratedHomeScreen: React.FC<IntegratedHomeScreenProps> = ({ onViewChange }) => {
  const { currentAddress, setCurrentAddress, coordinates, setCoordinates } = useAddress();
  const [inputAddress, setInputAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleAddressSubmit = async () => {
    if (!inputAddress.trim()) {
      alert('住所を入力してください');
      return;
    }

    setIsGeocoding(true);
    try {
      const geocodeUrl = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(inputAddress)}`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.geometry.coordinates[1]);
        const lng = parseFloat(location.geometry.coordinates[0]);
        
        setCurrentAddress(inputAddress);
        setCoordinates({ lat, lng });
        
        console.log('✅ 住所設定完了:', { address: inputAddress, coordinates: { lat, lng } });
      } else {
        alert('住所が見つかりませんでした。正確な住所を入力してください。');
      }
    } catch (error) {
      console.error('住所検索エラー:', error);
      alert('住所検索に失敗しました。インターネット接続を確認してください。');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLifestyleAnalysis = () => {
    if (currentAddress) {
      onViewChange('lifestyle');
    } else {
      alert('まず住所を設定してください');
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px'
    },
    mainTitle: {
      textAlign: 'center' as const,
      marginBottom: '48px'
    },
    title: {
      fontSize: '48px',
      fontWeight: 700,
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    },
    subtitle: {
      fontSize: '18px',
      color: '#6b7280',
      marginBottom: '32px'
    },
    inputSection: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      marginBottom: '32px'
    },
    inputTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
      fontSize: '20px',
      fontWeight: 600,
      color: '#1f2937'
    },
    currentAddress: {
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      border: '2px solid #10b981',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    },
    addressLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#059669',
      fontWeight: 600,
      marginBottom: '8px'
    },
    addressText: {
      fontSize: '18px',
      color: '#1f2937',
      marginBottom: '8px'
    },
    coordinates: {
      fontSize: '14px',
      color: '#6b7280'
    },
    inputRow: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap' as const
    },
    addressInput: {
      flex: '1',
      minWidth: '250px',
      padding: '16px 20px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.2s ease'
    },
    setBtn: {
      background: isGeocoding ? '#6b7280' : '#6366f1',
      color: 'white',
      border: 'none',
      padding: '16px 24px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: isGeocoding ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    suggestions: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap' as const,
      justifyContent: 'center'
    },
    suggestionBtn: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    analysisSection: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '32px',
      color: 'white',
      marginBottom: '32px'
    },
    analysisTitle: {
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    analysisDescription: {
      fontSize: '16px',
      opacity: 0.9,
      marginBottom: '32px',
      lineHeight: 1.6
    },
    currentLocation: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    },
    analyzeBtn: {
      background: '#10b981',
      color: 'white',
      border: 'none',
      padding: '16px 32px',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      width: '100%'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginTop: '48px'
    },
    featureCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      transition: 'transform 0.2s ease'
    },
    featureIcon: {
      fontSize: '32px',
      marginBottom: '16px'
    },
    featureTitle: {
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '8px',
      color: '#1f2937'
    },
    featureDescription: {
      color: '#6b7280',
      lineHeight: 1.6
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainTitle}>
        <h1 style={styles.title}>
          🏠 Location Insights
        </h1>
        <p style={styles.subtitle}>地域情報システム</p>
      </div>

      <div style={styles.inputSection}>
        <h2 style={styles.inputTitle}>
          📍 分析対象住所を入力
        </h2>
        
        {currentAddress && (
          <div style={styles.currentAddress}>
            <div style={styles.addressLabel}>
              ✅ 設定済み住所
            </div>
            <div style={styles.addressText}>
              {currentAddress}
            </div>
            {coordinates && (
              <div style={styles.coordinates}>
                座標: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </div>
            )}
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            type="text"
            style={styles.addressInput}
            placeholder="例: 東京都渋谷区神南1-1-1"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddressSubmit();
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            style={styles.setBtn}
            onClick={handleAddressSubmit}
            disabled={isGeocoding}
            onMouseEnter={(e) => {
              if (!isGeocoding) {
                e.currentTarget.style.background = '#4f46e5';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGeocoding) {
                e.currentTarget.style.background = '#6366f1';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            📍 {isGeocoding ? '検索中...' : '住所設定'}
          </button>
        </div>

        <div style={styles.suggestions}>
          {['東京都渋谷区神南1-1-1', '東京都新宿区新宿3-1-1', '京都府京都市中京区河原町通'].map((address) => (
            <button
              key={address}
              style={styles.suggestionBtn}
              onClick={() => setInputAddress(address)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {address}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.analysisSection}>
        <h2 style={styles.analysisTitle}>
          🏠 生活利便性スコア分析
        </h2>
        <p style={styles.analysisDescription}>
          安全面、交通、買い物、飲食、医療、教育、環境、文化・娯楽を項目で地域を総合評価します
        </p>
        
        <div style={styles.currentLocation}>
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📍 現在の分析対象住所
          </h3>
          <div>{currentAddress || '住所が設定されていません'}</div>
          <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
            ホーム画面で設定された住所です
          </div>
        </div>

        <button
          style={styles.analyzeBtn}
          onClick={handleLifestyleAnalysis}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#059669';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#10b981';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🔍 生活利便性を分析
        </button>
      </div>

      <div style={styles.featuresGrid}>
        {[
          { icon: '🛡️', title: '安全面', description: '犯罪率、街灯の設置状況、交番・警察署の位置などから安全性を評価' },
          { icon: '🚇', title: '交通', description: '最寄り駅までの距離、バス停の位置、主要エリアへのアクセス性を分析' },
          { icon: '🛒', title: '買い物', description: 'スーパー、コンビニ、商業施設の充実度と徒歩圏内の利便性' },
          { icon: '🍽️', title: '飲食', description: 'レストラン、カフェ、各種料理店の豊富さと質を評価' },
          { icon: '🏥', title: '医療', description: '病院、クリニック、薬局などの医療施設へのアクセスのしやすさ' },
          { icon: '🎓', title: '教育', description: '学校、図書館、学習塾など教育環境の充実度を測定' },
          { icon: '🌳', title: '環境', description: '公園、緑地、騒音レベル、大気質など居住環境の快適さ' },
          { icon: '🎭', title: '文化・娯楽', description: '美術館、映画館、スポーツ施設などの文化・レジャー施設の豊富さ' }
        ].map((feature, index) => (
          <div
            key={index}
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={styles.featureIcon}>{feature.icon}</div>
            <h3 style={styles.featureTitle}>{feature.title}</h3>
            <p style={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegratedHomeScreen;