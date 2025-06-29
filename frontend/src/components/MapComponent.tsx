import React, { useEffect, useRef, useState, useCallback } from 'react';

// Google Maps API の型定義の拡張
declare global {
  namespace google.maps {
    interface Marker {
      addListener(eventName: string, handler: Function): google.maps.MapsEventListener;
    }
    interface InfoWindow {
      open(map?: google.maps.Map | google.maps.StreetViewPanorama | null, anchor?: any): void;
    }
  }
}

interface MapComponentProps {
  address: string;
  analysisData?: any;
}

const MapComponent: React.FC<MapComponentProps> = ({ address, analysisData }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // APIキーの確認
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Google Maps APIスクリプトの読み込み
  const loadGoogleMapsScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // 既にAPIが読み込まれている場合
      if (window.google && window.google.maps) {
        setScriptLoaded(true);
        resolve();
        return;
      }

      // 既にスクリプトが追加されている場合
      if (document.querySelector('script[src*=\"maps.googleapis.com\"]')) {
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            setScriptLoaded(true);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setScriptLoaded(true);
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Google Maps API の読み込みに失敗しました'));
      };

      document.head.appendChild(script);
    });
  }, [apiKey]);

  // マップの初期化
  const initializeMap = useCallback(async () => {
    try {
      console.log('MapComponent: 初期化開始');
      setLoading(true);
      setError(null);

      if (!apiKey) {
        throw new Error('Google Maps API キーが設定されていません');
      }

      if (!address) {
        throw new Error('住所が指定されていません');
      }

      if (!mapRef.current) {
        throw new Error('マップコンテナが見つかりません');
      }

      // Google Maps API の読み込み待ち
      if (!scriptLoaded) {
        console.log('Google Maps API を読み込み中...');
        await loadGoogleMapsScript();
      }

      console.log('ジオコーディング開始...');
      
      // ジオコーディング
      const geocoder = new google.maps.Geocoder();
      const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          console.log(`ジオコーディング結果: ${status}`);
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`住所の検索に失敗しました: ${status}`));
          }
        });
      });

      if (!geocodeResult[0]?.geometry?.location) {
        throw new Error('住所が見つかりませんでした');
      }

      const location = geocodeResult[0].geometry.location;
      console.log(`位置情報: ${location.lat()}, ${location.lng()}`);

      // マップの作成
      console.log('マップを作成中...');
      const googleMap = new google.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // メインマーカーの追加
      const mainMarkerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FF0000',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF'
      };

      new google.maps.Marker({
        position: location,
        map: googleMap,
        title: address,
        icon: mainMarkerIcon as any
      });

      // 周辺施設マーカーの追加
      if (analysisData) {
        console.log('周辺施設マーカーを追加中...');
        addFacilityMarkers(googleMap, location);
      }

      setMap(googleMap);
      setLoading(false);
      console.log('マップ初期化完了');

    } catch (err) {
      console.error('マップ初期化エラー:', err);
      setError(err instanceof Error ? err.message : 'マップの初期化に失敗しました');
      setLoading(false);
    }
  }, [address, analysisData, apiKey, scriptLoaded, loadGoogleMapsScript]);

  // 周辺施設マーカーの追加
  const addFacilityMarkers = (map: google.maps.Map, location: google.maps.LatLng) => {
    const facilityTypes = [
      { type: 'hospital', name: '病院', color: '#FF6B6B' },
      { type: 'school', name: '学校', color: '#4ECDC4' },
      { type: 'supermarket', name: 'スーパー', color: '#45B7D1' },
      { type: 'subway_station', name: '駅', color: '#96CEB4' },
      { type: 'police', name: '交番', color: '#FFEAA7' },
      { type: 'park', name: '公園', color: '#DDA0DD' }
    ];

    const placesService = new google.maps.places.PlacesService(map);

    facilityTypes.forEach(facility => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: location,
        radius: 1000,
        type: facility.type as any,
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`${facility.name}: ${results.length}件見つかりました`);
          results.slice(0, 5).forEach(place => {
            if (place.geometry?.location) {
              const facilityMarkerIcon = {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: facility.color,
                fillOpacity: 0.8,
                strokeWeight: 1,
                strokeColor: '#FFFFFF'
              };

              const marker = new google.maps.Marker({
                position: place.geometry.location,
                map: map,
                title: place.name,
                icon: facilityMarkerIcon as any
              });

              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; max-width: 200px;">
                    <h4 style="margin: 0 0 5px 0; color: ${facility.color};">
                      ${facility.name}
                    </h4>
                    <p style="margin: 0; font-weight: bold;">${place.name}</p>
                    ${place.vicinity ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${place.vicinity}</p>` : ''}
                    ${place.rating ? `<p style="margin: 5px 0 0 0; font-size: 12px;">評価: ⭐ ${place.rating}</p>` : ''}
                  </div>
                `
              });

              (marker as any).addListener('click', () => {
                infoWindow.open(map, marker as any);
              });
            }
          });
        }
      });
    });
  };

  // アドレスが変更された時の初期化
  useEffect(() => {
    if (address && mapRef.current) {
      console.log('住所が変更されました:', address);
      initializeMap();
    }
  }, [address, initializeMap]);

  // エラー表示
  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee',
        border: '2px solid #fcc',
        borderRadius: '8px',
        color: '#c33'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>マップエラー</p>
          <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
          {!apiKey && (
            <p style={{ margin: '10px 0 0 0', fontSize: '12px' }}>
              Google Maps API キーを設定してください
            </p>
          )}
        </div>
      </div>
    );
  }

  // ローディング表示
  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        border: '2px solid #dee2e6',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }}></div>
          <p style={{ margin: 0, color: '#666' }}>マップを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 凡例 */}
      {map && (
        <div style={{
          marginBottom: '15px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🗺️ マップ凡例</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#FF0000' }}>●</span> 分析地点
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#FF6B6B' }}>●</span> 病院
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#4ECDC4' }}>●</span> 学校
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#45B7D1' }}>●</span> スーパー
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#96CEB4' }}>●</span> 駅
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#FFEAA7' }}>●</span> 交番
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#DDA0DD' }}>●</span> 公園
            </div>
          </div>
        </div>
      )}

      {/* マップコンテナ */}
      <div 
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}
      />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default MapComponent;