import React, { useState, useEffect } from 'react';
import { PopulationMap } from './PopulationMap';
import { PopulationChart } from './PopulationChart';
import { PopulationStats } from './PopulationStats';
import { populationApiService, PopulationResponse } from '../services/populationApi';

interface PopulationAnalysisProps {
  theme?: 'light' | 'dark';
}

export const PopulationAnalysis: React.FC<PopulationAnalysisProps> = ({ 
  theme = 'light' 
}) => {
  const [populationData, setPopulationData] = useState<PopulationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: 35.6762, // 東京駅
    lng: 139.6503,
    name: '東京駅周辺'
  });
  const [zoomLevel, setZoomLevel] = useState(13);
  const [searchRadius, setSearchRadius] = useState(2); // km

  // 人口統計データ
  const [populationStats, setPopulationStats] = useState({
    totalPopulation: 0,
    ageGroups: {} as { [key: string]: number },
    populationDensity: 0,
    trends: [] as { year: string; population: number }[]
  });

  // データ取得関数
  const fetchPopulationData = async () => {
    if (!selectedLocation.lat || !selectedLocation.lng) return;

    setLoading(true);
    setError(null);

    try {
      const data = await populationApiService.getPopulationDataByRegion(
        selectedLocation.lat,
        selectedLocation.lng,
        searchRadius,
        zoomLevel
      );

      setPopulationData(data);
      
      // 統計情報を計算
      const stats = populationApiService.calculatePopulationStats(data);
      setPopulationStats(stats);

    } catch (error) {
      console.error('人口データ取得エラー:', error);
      setError('人口データの取得に失敗しました。しばらく待ってから再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  // 初回データ取得
  useEffect(() => {
    fetchPopulationData();
  }, [selectedLocation, zoomLevel, searchRadius]);

  // 場所選択ハンドラー
  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setSelectedLocation({ lat, lng, name });
  };

  // プリセット場所
  const presetLocations = [
    { name: '東京駅', lat: 35.6762, lng: 139.6503 },
    { name: '新宿駅', lat: 35.6896, lng: 139.7006 },
    { name: '渋谷駅', lat: 35.6580, lng: 139.7016 },
    { name: '大阪駅', lat: 34.7024, lng: 135.4959 },
    { name: '名古屋駅', lat: 35.1706, lng: 136.8816 },
    { name: '札幌駅', lat: 43.0686, lng: 141.3507 }
  ];

  const cardBgColor = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

  return (
    <div className={`p-6 min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor}`}>
          <div className="p-6">
            <h1 className={`text-3xl font-bold ${textColor} mb-2`}>
              将来推計人口分析
            </h1>
            <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              国土数値情報を活用した地域別人口推計データの可視化
            </p>
          </div>
        </div>

        {/* 検索・設定パネル */}
        <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor}`}>
          <div className="p-6">
            <h2 className={`text-xl font-semibold ${textColor} mb-4`}>
              検索設定
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* 場所選択 */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  プリセット場所
                </label>
                <select
                  value={selectedLocation.name}
                  onChange={(e) => {
                    const location = presetLocations.find(loc => loc.name === e.target.value);
                    if (location) {
                      handleLocationSelect(location.lat, location.lng, location.name);
                    }
                  }}
                  className={`w-full p-3 border rounded-md ${borderColor} ${cardBgColor} ${textColor}`}
                >
                  {presetLocations.map(location => (
                    <option key={location.name} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ズームレベル */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  詳細度 (ズームレベル: {zoomLevel})
                </label>
                <input
                  type="range"
                  min="11"
                  max="15"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="w-full"
                />
                <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                  11: 市レベル ⟵→ 15: 詳細
                </div>
              </div>

              {/* 検索半径 */}
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  検索半径 ({searchRadius}km)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* 手動座標入力 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  緯度
                </label>
                <input
                  type="number"
                  value={selectedLocation.lat}
                  onChange={(e) => setSelectedLocation(prev => ({ ...prev, lat: Number(e.target.value) }))}
                  step="0.0001"
                  className={`w-full p-3 border rounded-md ${borderColor} ${cardBgColor} ${textColor}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textColor} mb-2`}>
                  経度
                </label>
                <input
                  type="number"
                  value={selectedLocation.lng}
                  onChange={(e) => setSelectedLocation(prev => ({ ...prev, lng: Number(e.target.value) }))}
                  step="0.0001"
                  className={`w-full p-3 border rounded-md ${borderColor} ${cardBgColor} ${textColor}`}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchPopulationData}
                  disabled={loading}
                  className={`w-full p-3 rounded-md font-medium transition-colors ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {loading ? '読み込み中...' : '検索'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* 統計情報サマリー */}
        <PopulationStats 
          stats={populationStats}
          location={selectedLocation}
          theme={theme}
        />

        {/* チャートとマップ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 人口推移チャート */}
          <PopulationChart 
            data={populationStats.trends}
            ageGroups={populationStats.ageGroups}
            theme={theme}
            loading={loading}
          />

          {/* 人口分布マップ */}
          <PopulationMap 
            data={populationData}
            center={selectedLocation}
            theme={theme}
            loading={loading}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        {/* データテーブル */}
        {populationData.length > 0 && (
          <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor}`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${textColor} mb-4`}>
                詳細データ ({populationData.reduce((sum, d) => sum + d.features.length, 0)} メッシュ)
              </h2>
              
              <div className="overflow-x-auto">
                <table className={`min-w-full border-collapse border ${borderColor}`}>
                  <thead>
                    <tr className={theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}>
                      <th className={`border ${borderColor} px-4 py-2 text-left ${textColor}`}>メッシュID</th>
                      <th className={`border ${borderColor} px-4 py-2 text-left ${textColor}`}>行政区域</th>
                      <th className={`border ${borderColor} px-4 py-2 text-left ${textColor}`}>総人口</th>
                      <th className={`border ${borderColor} px-4 py-2 text-left ${textColor}`}>0-14歳</th>
                      <th className={`border ${borderColor} px-4 py-2 text-left ${textColor}`}>15-64歳</th>
                      <th className={`border ${borderColor} px-4 py-2 text-left ${textColor}`}>65歳以上</th>
                    </tr>
                  </thead>
                  <tbody>
                    {populationData.slice(0, 3).map((response, idx) => 
                      response.features.slice(0, 10).map((feature, featureIdx) => (
                        <tr key={`${idx}-${featureIdx}`} className={theme === 'light' ? 'even:bg-gray-50' : 'even:bg-gray-800'}>
                          <td className={`border ${borderColor} px-4 py-2 ${textColor}`}>
                            {feature.properties.MESH_ID}
                          </td>
                          <td className={`border ${borderColor} px-4 py-2 ${textColor}`}>
                            {feature.properties.SHICODE}
                          </td>
                          <td className={`border ${borderColor} px-4 py-2 ${textColor}`}>
                            {feature.properties.PT00_2050 || 'N/A'}
                          </td>
                          <td className={`border ${borderColor} px-4 py-2 ${textColor}`}>
                            {feature.properties.PTA_2050 || 'N/A'}
                          </td>
                          <td className={`border ${borderColor} px-4 py-2 ${textColor}`}>
                            {feature.properties.PTB_2050 || 'N/A'}
                          </td>
                          <td className={`border ${borderColor} px-4 py-2 ${textColor}`}>
                            {feature.properties.PTC_2050 || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopulationAnalysis;
