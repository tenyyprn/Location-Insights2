import React from 'react';
import { CredibilityDisplayProps, DataSource } from '../types';

// 信頼性レベルの判定
const getReliabilityLevel = (score: number): { level: string; color: string; description: string } => {
  if (score >= 90) {
    return { level: '非常に高い', color: '#10b981', description: '複数の信頼できるソースから確認済み' };
  } else if (score >= 75) {
    return { level: '高い', color: '#059669', description: '信頼できるソースから確認済み' };
  } else if (score >= 60) {
    return { level: '中程度', color: '#f59e0b', description: '一部のソースから確認済み' };
  } else if (score >= 40) {
    return { level: '低い', color: '#f97316', description: '限定的なソースのみ' };
  } else {
    return { level: '非常に低い', color: '#ef4444', description: 'ソースの信頼性に課題あり' };
  }
};

// データソース表示コンポーネント
const DataSourceItem: React.FC<{ source: DataSource }> = ({ source }) => {
  const reliabilityInfo = getReliabilityLevel(source.reliability);
  
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div>
        <span className="font-medium text-sm">{source.name}</span>
        {source.category && (
          <span className="ml-2 text-xs text-gray-500">({source.category})</span>
        )}
      </div>
      <div className="flex items-center">
        <div 
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: reliabilityInfo.color }}
        />
        <span className="text-sm font-medium">{source.reliability}%</span>
      </div>
    </div>
  );
};

// メインのCredibilityDisplayコンポーネント
export const CredibilityDisplay: React.FC<CredibilityDisplayProps> = ({ 
  credibility, 
  compact = false, 
  showDetails = true 
}) => {
  const reliabilityInfo = getReliabilityLevel(credibility.overallReliability);

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: reliabilityInfo.color }}
        />
        <span className="text-sm font-medium">
          信頼性: {credibility.overallReliability}% ({reliabilityInfo.level})
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">データ信頼性評価</h3>
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: reliabilityInfo.color }}
          />
          <span className="text-lg font-bold" style={{ color: reliabilityInfo.color }}>
            {credibility.overallReliability}%
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>信頼性レベル: <strong>{reliabilityInfo.level}</strong></span>
          <span>データソース数: {credibility.sourceCount}</span>
        </div>
        <p className="text-sm text-gray-600">{reliabilityInfo.description}</p>
      </div>

      {/* 信頼性バー */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${credibility.overallReliability}%`,
            backgroundColor: reliabilityInfo.color 
          }}
        />
      </div>

      {/* データソース詳細 */}
      {showDetails && credibility.dataSources.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">データソース詳細</h4>
          <div className="space-y-2">
            {credibility.dataSources.map((source, index) => (
              <DataSourceItem key={index} source={source} />
            ))}
          </div>
        </div>
      )}

      {/* 最終更新日 */}
      {credibility.lastValidated && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            最終検証: {new Date(credibility.lastValidated).toLocaleDateString('ja-JP')}
          </p>
        </div>
      )}
    </div>
  );
};

// デフォルトエクスポート
export default CredibilityDisplay;
