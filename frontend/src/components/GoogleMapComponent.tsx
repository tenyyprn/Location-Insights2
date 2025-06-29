import React from 'react';

interface GoogleMapProps {
  coordinates?: { lat: number; lng: number };
  address?: string;
  facilities?: Array<{
    name: string;
    distance: number;
    types?: string[];
    place_id?: string;
  }>;
  height?: string;
  zoom?: number;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({ 
  coordinates, 
  address, 
  facilities = [], 
  height = '400px',
  zoom = 15 
}) => {
  // 周辺施設を表示するURLを生成（検索モード）
  const getSearchMapUrl = () => {
    if (!coordinates) return '';
    
    const { lat, lng } = coordinates;
    const baseUrl = 'https://www.google.com/maps/embed/v1/search';
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps APIキーが設定されていません');
      // APIキーがない場合は通常のGoogle Mapsリンクを返す
      return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}`;
    }
    
    // 住所周辺の施設を検索
    const query = address ? encodeURIComponent(`周辺施設 near ${address}`) : encodeURIComponent(`周辺施設 near ${lat},${lng}`);
    
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      center: `${lat},${lng}`,
      zoom: zoom.toString()
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  if (!coordinates) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '10px',
        color: '#6c757d'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2rem', marginBottom: '10px', display: 'block' }}>🗺️</span>
          <p>座標情報が取得できませんでした</p>
          <p style={{ fontSize: '0.9rem' }}>住所を分析すると地図が表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      borderRadius: '15px', 
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e9ecef'
    }}>
      {/* マップヘッダー */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
            🗺️ 地域マップ
          </h4>
          {address && (
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
              {address}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
              window.open(url, '_blank');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '8px 12px',
              borderRadius: '15px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            📱 Google Mapsで開く
          </button>
        </div>
      </div>
      
      {/* 地図表示 */}
      <iframe
        src={getSearchMapUrl()}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps"
      />
      
      {/* マップフッター */}
      <div style={{
        background: '#f8f9fa',
        padding: '10px 20px',
        fontSize: '0.8rem',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        📍 中心位置: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        {facilities.length > 0 && (
          <span style={{ marginLeft: '15px' }}>
            🏢 周辺施設: {facilities.length}件
          </span>
        )}
      </div>
    </div>
  );
};

export default GoogleMapComponent;
