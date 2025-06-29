import React from 'react';
import { X, MapPin, Clock, Star, Phone, Globe, Navigation } from 'lucide-react';

interface Facility {
  name: string;
  distance: number;
  rating?: number;
  types?: string[];
  user_ratings_total?: number;
  opening_hours?: { open_now: boolean };
  formatted_phone_number?: string;
  website?: string;
  place_id?: string;
}

interface FacilityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  facilities: Facility[];
  categoryIcon: string;
  categoryColor?: string;
}

const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  categoryName, 
  facilities, 
  categoryIcon,
  categoryColor = "blue"
}) => {
  if (!isOpen) return null;

  // 徒歩時間計算（80m/分で計算）
  const calculateWalkingTime = (distance: number): string => {
    if (!distance) return '-';
    const minutes = Math.ceil(distance / 80);
    return `${minutes}分`;
  };

  // 評価星表示
  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">評価なし</span>;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {/* 満点の星 */}
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {/* 半分の星 */}
        {hasHalfStar && (
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />
        )}
        {/* 空の星 */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // 施設タイプ別アイコン
  const getFacilityIcon = (types?: string[]): string => {
    if (!types || types.length === 0) return '📍';
    
    // 医療施設
    if (types.includes('hospital')) return '🏥';
    if (types.includes('pharmacy')) return '💊';
    if (types.includes('dentist')) return '🦷';
    if (types.includes('doctor')) return '👨‍⚕️';
    
    // 教育施設
    if (types.includes('school') || types.includes('university')) return '🏫';
    if (types.includes('library')) return '📚';
    
    // 交通施設
    if (types.includes('subway_station') || types.includes('train_station')) return '🚇';
    if (types.includes('bus_station')) return '🚌';
    
    // 商業施設
    if (types.includes('supermarket')) return '🏪';
    if (types.includes('convenience_store')) return '🏪';
    if (types.includes('restaurant')) return '🍽️';
    if (types.includes('cafe')) return '☕';
    if (types.includes('shopping_mall')) return '🛒';
    
    // 安全施設
    if (types.includes('police')) return '👮‍♂️';
    if (types.includes('fire_station')) return '🚒';
    if (types.includes('local_government_office')) return '🏛️';
    
    // 環境・文化施設
    if (types.includes('park')) return '🌳';
    if (types.includes('place_of_worship')) return '⛩️';
    if (types.includes('museum')) return '🏛️';
    if (types.includes('gym')) return '💪';
    
    return '📍';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      {/* モーダル */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col">
        {/* ヘッダー */}
        <div 
          className="flex items-center justify-between p-6 rounded-t-lg border-b"
          style={{ 
            background: `linear-gradient(135deg, ${getCategoryGradient(categoryColor)})` 
          }}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{categoryIcon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{categoryName}</h2>
              <p className="text-sm text-white opacity-90">
                {facilities.length}件の施設が見つかりました
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 施設リスト */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {facilities.map((facility, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 施設名と基本情報 */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">
                        {getFacilityIcon(facility.types)}
                      </span>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {facility.name || '名称不明'}
                      </h3>
                    </div>

                    {/* 距離と徒歩時間 */}
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-1 text-blue-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {facility.distance ? `${facility.distance}m` : '距離不明'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          徒歩{calculateWalkingTime(facility.distance)}
                        </span>
                      </div>
                    </div>

                    {/* 評価 */}
                    <div className="mb-2">
                      {renderStars(facility.rating)}
                      {facility.user_ratings_total && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({facility.user_ratings_total}件のレビュー)
                        </span>
                      )}
                    </div>

                    {/* 施設タイプ */}
                    {facility.types && facility.types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {facility.types.slice(0, 3).map((type, typeIndex) => (
                          <span key={typeIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {facility.types.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{facility.types.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 営業時間（もし利用可能なら） */}
                    {facility.opening_hours && (
                      <div className="flex items-center space-x-1 text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {facility.opening_hours.open_now ? (
                            <span className="text-green-600 font-medium">営業中</span>
                          ) : (
                            <span className="text-red-600 font-medium">営業時間外</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* 連絡先情報（もし利用可能なら） */}
                    <div className="flex space-x-4 text-sm text-gray-600">
                      {facility.formatted_phone_number && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{facility.formatted_phone_number}</span>
                        </div>
                      )}
                      {facility.website && (
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={facility.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            ウェブサイト
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button 
                      onClick={() => {
                        // Google Mapsでルート検索を開く
                        const query = encodeURIComponent(facility.name);
                        window.open(`https://www.google.com/maps/search/${query}`, '_blank');
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>ルート</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 施設がない場合 */}
          {facilities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl mb-2 block">🔍</span>
              <p>この地域では{categoryName}が見つかりませんでした。</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t p-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Google Maps APIから取得した実データを表示
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// カテゴリ別のグラデーション色を取得
const getCategoryGradient = (categoryColor: string): string => {
  const gradients: { [key: string]: string } = {
    'blue': '#667eea 0%, #764ba2 100%',
    'green': '#56ab2f 0%, #a8e6cf 100%',
    'pink': '#ff9a9e 0%, #fecfef 100%',
    'purple': '#a8edea 0%, #fed6e3 100%',
    'orange': '#ffecd2 0%, #fcb69f 100%',
    'red': '#ff8a80 0%, #ffb74d 100%',
    'teal': '#4ecdc4 0%, #44a08d 100%'
  };
  
  return gradients[categoryColor] || '#667eea 0%, #764ba2 100%';
};

export default FacilityDetailModal;
