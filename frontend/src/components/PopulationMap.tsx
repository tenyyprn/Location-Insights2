import React, { useState } from 'react';
import { PopulationResponse } from '../services/populationApi';

interface PopulationMapProps {
  data: PopulationResponse[];
  center: { lat: number; lng: number; name: string };
  theme?: 'light' | 'dark';
  loading?: boolean;
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
}

export const PopulationMap: React.FC<PopulationMapProps> = ({ 
  data, 
  center, 
  theme = 'light',
  loading = false,
  onLocationSelect
}) => {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const cardBgColor = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtextColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

  if (loading) {
    return (
      <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor} p-6`}>
        <div className="animate-pulse">
          <div className={`h-6 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded mb-4`}></div>
          <div className={`h-96 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded`}></div>
        </div>
      </div>
    );
  }

  // 人口データの最大値を計算してカラーマッピング用に使用
  const allPopulations = data.flatMap(response => 
    response.features.map(feature => Number(feature.properties.PT00_2050) || 0)
  );
  const maxPopulation = Math.max(...allPopulations, 1);

  // 人口密度に基づく色を取得
  const getPopulationColor = (population: number): string => {
    const density = population / maxPopulation;
    if (density > 0.8) return '#dc2626'; // 高密度 - 赤
    if (density > 0.6) return '#ea580c'; // 中高密度 - オレンジ
    if (density > 0.4) return '#d97706'; // 中密度 - 黄色
    if (density > 0.2) return '#65a30d'; // 低中密度 - 黄緑
    if (density > 0) return '#16a34a';   // 低密度 - 緑
    return '#9ca3af'; // データなし - グレー
  };

  // 人口密度のレベル表示
  const getDensityLevel = (population: number): string => {
    const density = population / maxPopulation;
    if (density > 0.8) return '非常に高い';
    if (density > 0.6) return '高い';
    if (density > 0.4) return '中程度';
    if (density > 0.2) return '低い';
    if (density > 0) return '非常に低い';
    return 'データなし';
  };

  // 簡易マップビュー（実際の地図APIがない場合のフォールバック）
  const renderSimpleMap = () => {
    const gridSize = 20; // グリッドのサイズ
    const cellSize = 400 / gridSize; // セルのピクセルサイズ

    return (
      <div className="relative">
        {/* 地図グリッド */}
        <svg viewBox="0 0 400 400" className="w-full h-96 border rounded">
          {/* 背景 */}
          <rect width="400" height="400" fill={theme === 'light' ? '#f8fafc' : '#1e293b'} />
          
          {/* グリッド線 */}
          {Array.from({ length: gridSize + 1 }).map((_, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={i * cellSize}
                y1="0"
                x2={i * cellSize}
                y2="400"
                stroke={theme === 'light' ? '#e2e8f0' : '#475569'}
                strokeWidth="0.5"
              />
              <line
                x1="0"
                y1={i * cellSize}
                x2="400"
                y2={i * cellSize}
                stroke={theme === 'light' ? '#e2e8f0' : '#475569'}
                strokeWidth="0.5"
              />
            </g>
          ))}
          
          {/* 人口データのマッピング */}
          {data.slice(0, 20).map((response, responseIdx) => 
            response.features.slice(0, 50).map((feature, featureIdx) => {
              const population = Number(feature.properties.PT00_2050) || 0;
              const x = (responseIdx * 5 + featureIdx) % gridSize;
              const y = Math.floor((responseIdx * 5 + featureIdx) / gridSize) % gridSize;
              
              return (
                <rect
                  key={`${responseIdx}-${featureIdx}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={getPopulationColor(population)}
                  opacity="0.7"
                  stroke="white"
                  strokeWidth="0.5"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedFeature(feature);
                    setShowDetails(true);
                  }}
                  onMouseEnter={(e) => {
                    const tooltip = document.getElementById('map-tooltip');
                    if (tooltip) {
                      tooltip.style.display = 'block';
                      tooltip.innerHTML = `
                        <div class="text-sm">
                          <div>メッシュ: ${feature.properties.MESH_ID}</div>
                          <div>人口: ${population.toLocaleString()}人</div>
                          <div>密度: ${getDensityLevel(population)}</div>
                        </div>
                      `;
                    }
                  }}
                  onMouseLeave={() => {
                    const tooltip = document.getElementById('map-tooltip');
                    if (tooltip) {
                      tooltip.style.display = 'none';
                    }
                  }}
                />
              );
            })
          )}
          
          {/* 中心点マーカー */}
          <circle
            cx="200"
            cy="200"
            r="6"
            fill="#dc2626"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x="200"
            y="215"
            textAnchor="middle"
            className={`text-xs font-medium ${textColor}`}
            fill="currentColor"
          >
            📍 {center.name}
          </text>
        </svg>
        
        {/* ツールチップ */}
        <div
          id="map-tooltip"
          className={`absolute pointer-events-none z-10 ${cardBgColor} border ${borderColor} rounded p-2 shadow-lg`}
          style={{ display: 'none' }}
        />
      </div>
    );
  };

  return (
    <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold ${textColor}`}>
            人口分布マップ
          </h3>
          <div className="text-sm">
            <span className={`${subtextColor}`}>
              データ数: {data.reduce((sum, d) => sum + d.features.length, 0)} メッシュ
            </span>
          </div>
        </div>

        {data.length > 0 ? (
          <div className="space-y-4">
            {renderSimpleMap()}
            
            {/* カラー凡例 */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${subtextColor}`}>人口密度</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${subtextColor}`}>低</span>
                <div className="flex">
                  {['#16a34a', '#65a30d', '#d97706', '#ea580c', '#dc2626'].map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-4"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className={`text-xs ${subtextColor}`}>高</span>
              </div>
            </div>

            {/* 統計サマリー */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className={`text-lg font-bold ${textColor}`}>
                  {allPopulations.length}
                </div>
                <div className={`text-xs ${subtextColor}`}>
                  メッシュ数
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${textColor}`}>
                  {Math.max(...allPopulations, 0).toLocaleString()}
                </div>
                <div className={`text-xs ${subtextColor}`}>
                  最大人口
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${textColor}`}>
                  {Math.round(allPopulations.reduce((sum, p) => sum + p, 0) / allPopulations.length || 0).toLocaleString()}
                </div>
                <div className={`text-xs ${subtextColor}`}>
                  平均人口
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${textColor}`}>
                  {allPopulations.reduce((sum, p) => sum + p, 0).toLocaleString()}
                </div>
                <div className={`text-xs ${subtextColor}`}>
                  総人口
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`text-center py-12 ${subtextColor}`}>
            <div className="text-4xl mb-4">🗺️</div>
            <p>表示する地図データがありません</p>
            <p className="text-sm mt-2">場所を選択してデータを取得してください</p>
          </div>
        )}

        {/* 詳細モーダル */}
        {showDetails && selectedFeature && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${cardBgColor} rounded-lg p-6 max-w-md w-full mx-4`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-lg font-semibold ${textColor}`}>
                  メッシュ詳細情報
                </h4>
                <button
                  onClick={() => setShowDetails(false)}
                  className={`text-gray-500 hover:text-gray-700`}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className={`font-medium ${textColor}`}>メッシュID: </span>
                  <span className={subtextColor}>{selectedFeature.properties.MESH_ID}</span>
                </div>
                <div>
                  <span className={`font-medium ${textColor}`}>行政区域コード: </span>
                  <span className={subtextColor}>{selectedFeature.properties.SHICODE}</span>
                </div>
                <div>
                  <span className={`font-medium ${textColor}`}>総人口: </span>
                  <span className={subtextColor}>
                    {Number(selectedFeature.properties.PT00_2050 || 0).toLocaleString()}人
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${textColor}`}>0-14歳: </span>
                  <span className={subtextColor}>
                    {Number(selectedFeature.properties.PTA_2050 || 0).toLocaleString()}人
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${textColor}`}>15-64歳: </span>
                  <span className={subtextColor}>
                    {Number(selectedFeature.properties.PTB_2050 || 0).toLocaleString()}人
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${textColor}`}>65歳以上: </span>
                  <span className={subtextColor}>
                    {Number(selectedFeature.properties.PTC_2050 || 0).toLocaleString()}人
                  </span>
                </div>
                
                {/* 人口密度レベル */}
                <div className="pt-3 border-t border-gray-200">
                  <span className={`font-medium ${textColor}`}>人口密度レベル: </span>
                  <span className={`font-semibold ${
                    getDensityLevel(Number(selectedFeature.properties.PT00_2050 || 0)) === '非常に高い' ? 'text-red-600' :
                    getDensityLevel(Number(selectedFeature.properties.PT00_2050 || 0)) === '高い' ? 'text-orange-600' :
                    getDensityLevel(Number(selectedFeature.properties.PT00_2050 || 0)) === '中程度' ? 'text-yellow-600' :
                    getDensityLevel(Number(selectedFeature.properties.PT00_2050 || 0)) === '低い' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {getDensityLevel(Number(selectedFeature.properties.PT00_2050 || 0))}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopulationMap;