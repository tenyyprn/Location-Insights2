// EnhancedAnalysisDisplay.tsx - 統合分析結果表示コンポーネント

import React, { useState, useEffect } from 'react';
import { integratedAnalysisService } from '../services/IntegratedAnalysisService';
import { CredibilityDisplay } from './CredibilityDisplay';
import { EnhancedAnalysisResult } from '../types';
import './EnhancedAnalysisDisplay.css';

interface EnhancedAnalysisDisplayProps {
  address: string;
  coordinates?: { lat: number; lng: number };
  onAnalysisComplete?: (result: EnhancedAnalysisResult) => void;
}

export const EnhancedAnalysisDisplay: React.FC<EnhancedAnalysisDisplayProps> = ({
  address,
  coordinates,
  onAnalysisComplete
}) => {
  const [analysisResult, setAnalysisResult] = useState<EnhancedAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'future' | 'swot' | 'quality'>('overview');
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (address) {
      performIntegratedAnalysis();
    }
  }, [address, coordinates]);

  const performIntegratedAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 統合分析開始...', address);
      
      const result = await integratedAnalysisService.performIntegratedAnalysis(address, coordinates);
      
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
      
      console.log('✅ 統合分析完了');
    } catch (err) {
      console.error('❌ 統合分析エラー:', err);
      setError(err instanceof Error ? err.message : '統合分析中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="enhanced-analysis-loading">
        <div className="loading-container">
          <div className="analysis-stages">
            <div className="stage active">
              <div className="stage-icon">🔍</div>
              <span>基本分析</span>
            </div>
            <div className="stage active">
              <div className="stage-icon">⚖️</div>
              <span>一貫性チェック</span>
            </div>
            <div className="stage active">
              <div className="stage-icon">📊</div>
              <span>信憑性評価</span>
            </div>
            <div className="stage">
              <div className="stage-icon">🎯</div>
              <span>結果統合</span>
            </div>
          </div>
          <h3>🧠 Enhanced AI分析実行中...</h3>
          <p>高品質な分析結果をお届けするため、複数段階の検証を実施しています</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-error">
        <h3>⚠️ 分析エラー</h3>
        <p>{error}</p>
        <button onClick={performIntegratedAnalysis} className="retry-button">
          🔄 再試行
        </button>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="analysis-placeholder">
        <h3>📍 住所を入力して高品質分析を開始してください</h3>
        <p>一貫性チェック・信憑性評価機能付きの詳細分析をお届けします</p>
      </div>
    );
  }

  const { finalResult, credibilityAnalysis, consistentAnalysis } = analysisResult;

  return (
    <div className="enhanced-analysis-display">
      {/* 分析品質ヘッダー */}
      <div className="analysis-quality-header">
        <div className="header-main">
          <h2>🏠 Enhanced Lifestyle Analysis</h2>
          <div className="quality-badges">
            <QualityBadge
              label="総合品質"
              score={finalResult.qualityMetrics.overallQuality}
              type="overall"
            />
            <QualityBadge
              label="一貫性"
              score={finalResult.qualityMetrics.consistencyScore}
              type="consistency"
            />
            <QualityBadge
              label="信頼度"
              score={finalResult.qualityMetrics.credibilityScore}
              type="credibility"
            />
          </div>
        </div>
        
        <div className="header-controls">
          <button
            className={`comparison-toggle ${showOriginal ? 'active' : ''}`}
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? '📊 改善後' : '🔍 改善前後比較'}
          </button>
        </div>
        
        <div className="analysis-summary">
          <span className="location">📍 {address}</span>
          <span className="improvements-count">
            {consistentAnalysis.contradictions.length > 0 && 
              `✅ ${consistentAnalysis.contradictions.length}件の問題を修正`
            }
          </span>
        </div>
      </div>

      {/* 改善前後比較（オプション表示） */}
      {showOriginal && (
        <div className="before-after-comparison">
          <h3>📊 改善前後の比較</h3>
          <ComparisonDisplay
            original={analysisResult.originalAnalysis}
            improved={finalResult}
            contradictions={consistentAnalysis.contradictions}
          />
        </div>
      )}

      {/* タブナビゲーション */}
      <div className="enhanced-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 概要
        </button>
        <button 
          className={`tab ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          🔍 詳細分析
        </button>
        <button 
          className={`tab ${activeTab === 'future' ? 'active' : ''}`}
          onClick={() => setActiveTab('future')}
        >
          🔮 将来予測
        </button>
        <button 
          className={`tab ${activeTab === 'swot' ? 'active' : ''}`}
          onClick={() => setActiveTab('swot')}
        >
          🎯 SWOT分析
        </button>
        <button 
          className={`tab ${activeTab === 'quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('quality')}
        >
          📋 品質情報
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="tab-content-container">
        {activeTab === 'overview' && (
          <OverviewTab finalResult={finalResult} />
        )}
        
        {activeTab === 'detailed' && (
          <DetailedAnalysisTab finalResult={finalResult} />
        )}
        
        {activeTab === 'future' && (
          <FuturePredictionTab finalResult={finalResult} />
        )}
        
        {activeTab === 'swot' && (
          <SWOTAnalysisTab finalResult={finalResult} />
        )}
        
        {activeTab === 'quality' && (
          <QualityInformationTab 
            credibilityData={credibilityAnalysis}
            consistencyData={consistentAnalysis}
            qualityMetrics={finalResult.qualityMetrics}
          />
        )}
      </div>
    </div>
  );
};

// 品質バッジコンポーネント
interface QualityBadgeProps {
  label: string;
  score: number;
  type: 'overall' | 'consistency' | 'credibility';
}

const QualityBadge: React.FC<QualityBadgeProps> = ({ label, score, type }) => {
  const getColor = (score: number, type: string) => {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#84cc16';
    if (score >= 60) return '#eab308';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'overall': return '🏆';
      case 'consistency': return '⚖️';
      case 'credibility': return '📊';
      default: return '📋';
    }
  };

  return (
    <div 
      className="quality-badge"
      style={{ 
        borderColor: getColor(score, type),
        backgroundColor: `${getColor(score, type)}15`
      }}
    >
      <span className="badge-icon">{getIcon(type)}</span>
      <div className="badge-content">
        <span className="badge-label">{label}</span>
        <span 
          className="badge-score"
          style={{ color: getColor(score, type) }}
        >
          {score}%
        </span>
      </div>
    </div>
  );
};

// 比較表示コンポーネント
interface ComparisonDisplayProps {
  original: any;
  improved: any;
  contradictions: any[];
}

const ComparisonDisplay: React.FC<ComparisonDisplayProps> = ({ 
  original, 
  improved, 
  contradictions 
}) => {
  return (
    <div className="comparison-container">
      <div className="comparison-section">
        <h4>🔍 検出された問題</h4>
        <div className="contradictions-list">
          {contradictions.map((contradiction, index) => (
            <div key={index} className={`contradiction-item ${contradiction.severity}`}>
              <span className="severity-badge">{contradiction.severity}</span>
              <span className="contradiction-description">{contradiction.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="comparison-section">
        <h4>📊 スコア比較</h4>
        <div className="scores-comparison">
          {Object.entries(improved.lifestyleScore || {}).map(([category, newScore]) => {
            const oldScore = original.lifestyleScore?.[category];
            const hasChanged = oldScore !== newScore;
            
            return (
              <div key={category} className="score-comparison-item">
                <span className="category-name">{category}</span>
                <div className="score-change">
                  {hasChanged ? (
                    <>
                      <span className="old-score">{String(oldScore)}</span>
                      <span className="arrow">→</span>
                      <span className="new-score">{String(newScore)}</span>
                    </>
                  ) : (
                    <span className="unchanged-score">{String(newScore)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 概要タブ
const OverviewTab: React.FC<{ finalResult: any }> = ({ finalResult }) => (
  <div className="overview-tab">
    {/* ライフスタイルスコア */}
    <div className="section">
      <h3>🏆 ライフスタイルスコア（品質保証済み）</h3>
      <div className="scores-grid">
        {Object.entries(finalResult.lifestyleScore).map(([category, score]) => (
          <ScoreCard
            key={category}
            category={category}
            score={score as number}
            isEnhanced={true}
          />
        ))}
      </div>
    </div>

    {/* サマリー分析 */}
    <div className="section">
      <h3>📋 分析サマリー</h3>
      <div className="summary-grid">
        <div className="summary-card strengths">
          <h4>💪 主な強み ({finalResult.detailedAnalysis.strengths.length}項目)</h4>
          <ul>
            {finalResult.detailedAnalysis.strengths.slice(0, 3).map((strength: string, index: number) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
        
        <div className="summary-card improvements">
          <h4>🎯 改善提案 ({finalResult.detailedAnalysis.improvements.length}項目)</h4>
          <ul>
            {finalResult.detailedAnalysis.improvements.slice(0, 3).map((improvement: string, index: number) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// 詳細分析タブ
const DetailedAnalysisTab: React.FC<{ finalResult: any }> = ({ finalResult }) => (
  <div className="detailed-tab">
    <div className="analysis-sections">
      <div className="analysis-section strengths">
        <h3>💪 強み</h3>
        <ul>
          {finalResult.detailedAnalysis.strengths.map((strength: string, index: number) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-section weaknesses">
        <h3>⚠️ 改善点</h3>
        <ul>
          {finalResult.detailedAnalysis.weaknesses.map((weakness: string, index: number) => (
            <li key={index}>{weakness}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-section recommendations">
        <h3>💡 推奨事項</h3>
        <ul>
          {finalResult.detailedAnalysis.recommendations.map((rec: string, index: number) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// 将来予測タブ
const FuturePredictionTab: React.FC<{ finalResult: any }> = ({ finalResult }) => (
  <div className="future-tab">
    <div className="predictions-container">
      <div className="prediction-card short-term">
        <h4>📅 1年後の予測</h4>
        <p>{finalResult.futurePredict.oneYear}</p>
        <div className="confidence-indicator">
          信頼度: {finalResult.futurePredict.confidenceLevels.oneYear}%
        </div>
      </div>

      <div className="prediction-card medium-term">
        <h4>📅 3年後の予測</h4>
        <p>{finalResult.futurePredict.threeYears}</p>
        <div className="confidence-indicator">
          信頼度: {finalResult.futurePredict.confidenceLevels.threeYears}%
        </div>
      </div>

      <div className="prediction-card long-term">
        <h4>📅 5年後の予測</h4>
        <p>{finalResult.futurePredict.fiveYears}</p>
        <div className="confidence-indicator">
          信頼度: {finalResult.futurePredict.confidenceLevels.fiveYears}%
        </div>
      </div>
    </div>
  </div>
);

// SWOT分析タブ
const SWOTAnalysisTab: React.FC<{ finalResult: any }> = ({ finalResult }) => (
  <div className="swot-tab">
    <div className="swot-grid">
      <div className="swot-section strengths">
        <h4>💪 強み (Strengths)</h4>
        <ul>
          {finalResult.swotAnalysis.strengths.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="swot-section weaknesses">
        <h4>⚠️ 弱み (Weaknesses)</h4>
        <ul>
          {finalResult.swotAnalysis.weaknesses.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="swot-section opportunities">
        <h4>🌟 機会 (Opportunities)</h4>
        <ul>
          {finalResult.swotAnalysis.opportunities.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="swot-section threats">
        <h4>⚡ 脅威 (Threats)</h4>
        <ul>
          {finalResult.swotAnalysis.threats.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>

    <div className="strategic-recommendations">
      <h4>🎯 戦略的推奨事項</h4>
      <ul>
        {finalResult.swotAnalysis.strategicRecommendations.map((rec: string, index: number) => (
          <li key={index}>{rec}</li>
        ))}
      </ul>
    </div>
  </div>
);

// 品質情報タブ
const QualityInformationTab: React.FC<{
  credibilityData: any;
  consistencyData: any;
  qualityMetrics: any;
}> = ({ credibilityData, consistencyData, qualityMetrics }) => (
  <div className="quality-tab">
    <CredibilityDisplay 
      credibility={credibilityData}
      compact={false}
      showDetails={true}
    />
    
    <div className="quality-improvements">
      <h4>✅ 品質改善事項</h4>
      <ul>
        {qualityMetrics.improvements.map((improvement: string, index: number) => (
          <li key={index}>{improvement}</li>
        ))}
      </ul>
    </div>
  </div>
);

// スコアカードコンポーネント
interface ScoreCardProps {
  category: string;
  score: number;
  isEnhanced: boolean;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ category, score, isEnhanced }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return '優秀';
    if (score >= 75) return '良好';
    if (score >= 65) return '標準的';
    if (score >= 55) return 'やや不足';
    if (score >= 45) return '不足';
    return '大幅不足';
  };

  return (
    <div className="enhanced-score-card">
      <div className="score-header">
        <h4>{category}</h4>
        {isEnhanced && <span className="enhanced-badge">✅</span>}
      </div>
      <div className="score-display">
        <span 
          className="score-value"
          style={{ color: getScoreColor(score) }}
        >
          {score}
        </span>
        <span className="score-label">{getScoreLabel(score)}</span>
      </div>
      <div className="score-bar">
        <div 
          className="score-fill"
          style={{ 
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>
    </div>
  );
};

export default EnhancedAnalysisDisplay;