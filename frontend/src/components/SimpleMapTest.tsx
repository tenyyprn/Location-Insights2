import React from 'react';

interface SimpleMapTestProps {
  address: string;
}

const SimpleMapTest: React.FC<SimpleMapTestProps> = ({ address }) => {
  return (
    <div style={{ width: '100%', marginBottom: '20px' }}>
      <h3>🗺️ 簡易マップテスト (静的表示)</h3>
      <div style={{
        width: '100%',
        height: '400px',
        border: '2px solid #dee2e6',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        {/* Google Maps Embed API を使用した静的マップ */}
        <iframe
          src={`https://www.google.com/maps/embed/v1/search?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address)}&zoom=15`}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: '6px' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps"
        />
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        ⚠️ 動的マップに問題がある場合の代替表示です
      </p>
    </div>
  );
};

export default SimpleMapTest;