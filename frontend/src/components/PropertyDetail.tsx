import React, { useState, useEffect } from 'react';
import { LocationAnalysis, LoadingState, ApiError, PropertyDetailProps } from '../types/mlit';
import { MLITApiClient, mlitUtils } from '../services/mlitApi';
import LocationAnalysisComponent from './LocationAnalysis';

const PropertyDetail: React.FC<PropertyDetailProps> = ({ 
  property, 
  analysis: initialAnalysis,
  onAnalysisRequest 
}) => {
  const [analysis, setAnalysis] = useState<LocationAnalysis | null>(initialAnalysis || null);
  const [loading, setLoading] = useState<LoadingState>({
    schools: false,
    medical: false,
    stations: false,
    realEstate: false,
    analysis: false
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [radius, setRadius] = useState<number>(1000);
  const [activeTab, setActiveTab] = useState<'map' | 'analysis'>('analysis');

  // 分析データの取得
  const fetchAnalysis = async (lat: number, lng: number, searchRadius: number = radius) => {
    setLoading(prev => ({ ...prev, analysis: true }));
    setError(null);

    try {
      const response = await MLITApiClient.getLocationAnalysis(lat, lng, searchRadius);
      
      if (response.success && response.data) {
        setAnalysis(response.data);
        if (onAnalysisRequest) {
          onAnalysisRequest(lat, lng);
        }
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err as ApiError);
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  };

  // 半径変更ハンドラー
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (analysis) {
      fetchAnalysis(property.coordinates.latitude, property.coordinates.longitude, newRadius);
    }
  };

  // 初期データ取得
  useEffect(() => {
    if (!initialAnalysis) {
      fetchAnalysis(property.coordinates.latitude, property.coordinates.longitude);
    }
  }, [property.coordinates]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">��� 物件詳細分析</h1>
        <div className="text-indigo-100">
          <div className="mb-1">{property.address}</div>
          <div className="text-sm">
            ��� {property.coordinates.latitude.toFixed(6)}, {property.coordinates.longitude.toFixed(6)}
          </div>
          {property.price && (
            <div className="text-sm mt-1">��� {mlitUtils.formatPrice(property.price)}</div>
          )}
        </div>
      </div>

      {/* コントロールパネル */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* タブ */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ���️ 地図（準備中）
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ��� 詳細分析
            </button>
          </div>

          {/* 半径設定 */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">検索半径:</label>
            <select
              value={radius}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading.analysis}
            >
              <option value={500}>500m</option>
              <option value={1000}>1km</option>
              <option value={1500}>1.5km</option>
              <option value={2000}>2km</option>
            </select>
            
            <button
              onClick={() => fetchAnalysis(property.coordinates.latitude, property.coordinates.longitude)}
              disabled={loading.analysis}
              className="px-4 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.analysis ? '更新中...' : '��� 更新'}
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="p-6">
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* 地図プレースホルダー */}
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">���️</div>
                <div className="text-lg font-medium mb-2">インタラクティブ地図</div>
                <div className="text-sm mb-2">準備中です</div>
                <div className="text-xs">
                  座標: {property.coordinates.latitude.toFixed(4)}, {property.coordinates.longitude.toFixed(4)}
                </div>
                <div className="text-xs mt-1">検索半径: {radius}m</div>
              </div>
            </div>

            {/* 簡易統計 */}
            {analysis && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.schools.length}</div>
                  <div className="text-sm text-blue-800">��� 教育施設</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{analysis.medical.length}</div>
                  <div className="text-sm text-red-800">��� 医療機関</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{analysis.stations.length}</div>
                  <div className="text-sm text-green-800">��� 駅</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{analysis.analysis.grade}</div>
                  <div className="text-sm text-purple-800">��� 総合評価</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <LocationAnalysisComponent
            analysis={analysis}
            loading={loading}
            error={error}
            onLocationChange={(lat, lng) => fetchAnalysis(lat, lng)}
          />
        )}
      </div>
    </div>
  );
};

export default PropertyDetail;
