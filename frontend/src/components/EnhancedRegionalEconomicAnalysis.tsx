import React, { useState, useEffect } from 'react';
import { useAddress } from '../context/AddressContext';
import EnhancedRegionalEconomicService, { RegionalEconomicData, TimeSeriesData, IndustryData } from '../services/EnhancedRegionalEconomicService';

// 進歩したチャートコンポーネント
const AdvancedLineChart: React.FC<{ 
  data: TimeSeriesData[]; 
  title: string; 
  color: string;
  showTrend?: boolean;
  unit?: string;
}> = ({ data, title, color, showTrend = false, unit = '' }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  // トレンド計算
  const trend = data.length > 1 ? 
    ((data[data.length - 1].value - data[0].value) / data[0].value) * 100 : 0;

  return (
    <div style={{
      background: 'white',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      marginBottom: '25px',
      border: '1px solid #f0f0f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#374151', fontSize: '1.2rem', margin: 0, fontWeight: '600' }}>{title}</h3>
        {showTrend && (
          <div style={{
            background: trend >= 0 ? '#dcfce7' : '#fef2f2',
            color: trend >= 0 ? '#166534' : '#dc2626',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            {trend >= 0 ? '📈' : '📉'} {trend.toFixed(1)}%
          </div>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'end',
        height: '220px',
        gap: '3px',
        padding: '15px 0',
        marginBottom: '15px'
      }}>
        {data.map((item, index) => {
          const height = range > 0 ? ((item.value - minValue) / range) * 180 + 20 : 100;
          const isLatest = index === data.length - 1;
          
          return (
            <div
              key={index}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '20px'
              }}
            >
              <div
                style={{
                  height: `${height}px`,
                  backgroundColor: isLatest ? color : `${color}88`,
                  width: '100%',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  transition: 'all 0.4s ease',
                  boxShadow: isLatest ? `0 2px 8px ${color}40` : 'none'
                }}
                title={`${item.year}年: ${item.value.toLocaleString()}${unit}`}
              />
              <div style={{
                fontSize: '0.7rem',
                color: '#9ca3af',
                marginTop: '8px',
                transform: 'rotate(-45deg)',
                transformOrigin: 'center',
                whiteSpace: 'nowrap'
              }}>
                {item.year}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 0',
        borderTop: '1px solid #f3f4f6'
      }}>
        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          最新値: <span style={{ fontWeight: '600', color: '#374151' }}>
            {data[data.length - 1]?.value.toLocaleString()}{unit}
          </span>
        </div>
        {data[data.length - 1]?.changeRate !== undefined && (
          <div style={{
            color: (data[data.length - 1]?.changeRate || 0) > 0 ? '#059669' : '#dc2626',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            前年比: {(data[data.length - 1]?.changeRate || 0) > 0 ? '+' : ''}{(data[data.length - 1]?.changeRate || 0).toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
};

// スコアメーター
const ScoreMeter: React.FC<{ 
  score: number; 
  title: string; 
  color: string; 
  icon: string;
  description?: string;
}> = ({ score, title, color, icon, description }) => {
  const percentage = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      background: 'white',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      textAlign: 'center',
      border: `2px solid ${color}20`,
      position: 'relative'
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{icon}</div>
      
      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: color
        }}>
          {score.toFixed(0)}
        </div>
      </div>
      
      <h4 style={{
        color: '#374151',
        margin: '0 0 10px 0',
        fontSize: '1.1rem',
        fontWeight: '600'
      }}>
        {title}
      </h4>
      
      {description && (
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          margin: 0,
          lineHeight: 1.4
        }}>
          {description}
        </p>
      )}
    </div>
  );
};

// 🎯 新機能：インタラクティブ産業構造チャート
const InteractiveIndustryChart: React.FC<{
  industries: IndustryData[];
}> = ({ industries }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<number | null>(null);
  const maxEmployees = Math.max(...industries.map(i => i.employeeCount));
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '20px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <h3 style={{ 
        color: '#374151', 
        marginBottom: '30px', 
        fontSize: '1.4rem', 
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🏭 産業別従業者数分析 - 実データベース
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {industries.slice(0, 6).map((industry, index) => {
          const width = (industry.employeeCount / maxEmployees) * 100;
          const isSelected = selectedIndustry === index;
          
          return (
            <div 
              key={index} 
              style={{
                position: 'relative',
                padding: '20px',
                background: isSelected ? '#f8fafc' : 'transparent',
                borderRadius: '15px',
                border: isSelected ? '2px solid #e2e8f0' : '2px solid transparent',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setSelectedIndustry(index)}
              onMouseLeave={() => setSelectedIndustry(null)}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                marginBottom: '15px'
              }}>
                <div style={{
                  minWidth: '160px',
                  fontSize: '1rem',
                  color: '#374151',
                  fontWeight: '600'
                }}>
                  {industry.name}
                </div>
                <div style={{
                  flex: 1,
                  height: '40px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div
                    style={{
                      width: `${width}%`,
                      height: '100%',
                      background: `linear-gradient(135deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}80)`,
                      borderRadius: '20px',
                      transition: 'width 1.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '15px',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {industry.employeeCount.toLocaleString()}人
                  </div>
                </div>
                <div style={{
                  minWidth: '80px',
                  fontSize: '0.9rem',
                  color: industry.growthRate >= 0 ? '#059669' : '#dc2626',
                  fontWeight: '700',
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {industry.growthRate >= 0 ? '📈' : '📉'}
                  {industry.growthRate >= 0 ? '+' : ''}{industry.growthRate.toFixed(1)}%
                </div>
              </div>
              
              {isSelected && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  color: '#6b7280',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>事業所数:</span>
                    <span style={{ fontWeight: '600', color: '#374151' }}>
                      {industry.establishmentCount.toLocaleString()}社
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>生産額:</span>
                    <span style={{ fontWeight: '600', color: '#374151' }}>
                      {Math.round(industry.outputValue / 100000000).toLocaleString()}億円
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>平均従業者数/事業所:</span>
                    <span style={{ fontWeight: '600', color: '#374151' }}>
                      {Math.round(industry.employeeCount / industry.establishmentCount)}人
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 🎯 新機能：AI推奨アクションカード
const AIRecommendationCard: React.FC<{ 
  grade: string; 
  recommendations: string[];
  vitalityIndex: number;
  riskScore: number;
  futureProspects: number;
}> = ({ grade, recommendations, vitalityIndex, riskScore, futureProspects }) => {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#059669';
    if (grade.startsWith('B')) return '#d97706';
    return '#dc2626';
  };

  const getGradeMessage = (grade: string) => {
    if (grade === 'A+') return '🏆 最高評価！積極的投資推奨';
    if (grade === 'A') return '✨ 優良投資対象';
    if (grade.startsWith('B')) return '⚖️ 慎重な検討を推奨';
    return '⚠️ 高リスク・要注意';
  };

  const getOverallScore = () => (vitalityIndex + riskScore + futureProspects) / 3;

  return (
    <div style={{
      background: 'white',
      padding: '40px',
      borderRadius: '25px',
      boxShadow: '0 15px 60px rgba(0,0,0,0.15)',
      border: `4px solid ${getGradeColor(grade)}20`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景グラデーション */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: `conic-gradient(from 45deg, ${getGradeColor(grade)}05, transparent, ${getGradeColor(grade)}10, transparent)`,
        animation: 'rotate 30s linear infinite',
        pointerEvents: 'none'
      }} />
      
      {/* グレードバッジ */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        left: '40px',
        background: `linear-gradient(135deg, ${getGradeColor(grade)}, ${getGradeColor(grade)}80)`,
        color: 'white',
        padding: '12px 25px',
        borderRadius: '30px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        boxShadow: `0 6px 20px ${getGradeColor(grade)}40`
      }}>
        📊 投資評価: {grade}ランク
      </div>
      
      <div style={{ marginTop: '30px', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
        <h3 style={{
          color: getGradeColor(grade),
          fontSize: '1.8rem',
          margin: '0 0 20px 0',
          fontWeight: 'bold'
        }}>
          {getGradeMessage(grade)}
        </h3>
        
        {/* スコア表示 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          margin: '25px 0'
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            borderRadius: '15px',
            border: '2px solid #0ea5e9'
          }}>
            <div style={{ fontSize: '2.5rem', color: '#0369a1', fontWeight: 'bold', marginBottom: '5px' }}>
              {vitalityIndex}
            </div>
            <div style={{ fontSize: '1rem', color: '#0369a1', fontWeight: '600' }}>地域活力指数</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>人口・経済活力</div>
          </div>
          
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            borderRadius: '15px',
            border: '2px solid #22c55e'
          }}>
            <div style={{ fontSize: '2.5rem', color: '#15803d', fontWeight: 'bold', marginBottom: '5px' }}>
              {riskScore}
            </div>
            <div style={{ fontSize: '1rem', color: '#15803d', fontWeight: '600' }}>リスクスコア</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>投資安全性</div>
          </div>
          
          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
            borderRadius: '15px',
            border: '2px solid #eab308'
          }}>
            <div style={{ fontSize: '2.5rem', color: '#a16207', fontWeight: 'bold', marginBottom: '5px' }}>
              {futureProspects}
            </div>
            <div style={{ fontSize: '1rem', color: '#a16207', fontWeight: '600' }}>将来性スコア</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>成長期待度</div>
          </div>

          <div style={{ 
            textAlign: 'center',
            padding: '20px',
            background: `linear-gradient(135deg, ${getGradeColor(grade)}10, ${getGradeColor(grade)}05)`,
            borderRadius: '15px',
            border: `2px solid ${getGradeColor(grade)}`
          }}>
            <div style={{ fontSize: '2.5rem', color: getGradeColor(grade), fontWeight: 'bold', marginBottom: '5px' }}>
              {getOverallScore().toFixed(0)}
            </div>
            <div style={{ fontSize: '1rem', color: getGradeColor(grade), fontWeight: '600' }}>総合スコア</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>統合評価</div>
          </div>
        </div>
      </div>
      
      {/* AI推奨事項 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h4 style={{ 
          color: '#374151', 
          marginBottom: '20px', 
          fontSize: '1.3rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🤖 AI投資推奨事項
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {recommendations.map((rec, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                padding: '20px',
                borderRadius: '15px',
                fontSize: '1rem',
                lineHeight: 1.6,
                color: '#374151',
                borderLeft: `5px solid ${getGradeColor(grade)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px' 
              }}>
                <div style={{
                  background: getGradeColor(grade),
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {index + 1}
                </div>
                <div>{rec}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const InvestmentRecommendationCard: React.FC<{ 
  grade: string; 
  recommendations: string[];
  vitalityIndex: number;
  riskScore: number;
}> = ({ grade, recommendations, vitalityIndex, riskScore }) => {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#059669';
    if (grade.startsWith('B')) return '#d97706';
    return '#dc2626';
  };

  const getGradeMessage = (grade: string) => {
    if (grade === 'A+') return '最高評価！積極的投資推奨';
    if (grade === 'A') return '優良投資対象';
    if (grade.startsWith('B')) return '慎重な検討を推奨';
    return '高リスク・要注意';
  };

  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '20px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      border: `3px solid ${getGradeColor(grade)}20`,
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '-15px',
        left: '30px',
        background: getGradeColor(grade),
        color: 'white',
        padding: '8px 20px',
        borderRadius: '25px',
        fontSize: '0.9rem',
        fontWeight: 'bold'
      }}>
        投資評価: {grade}ランク
      </div>
      
      <div style={{ marginTop: '20px', marginBottom: '25px' }}>
        <h3 style={{
          color: getGradeColor(grade),
          fontSize: '1.5rem',
          margin: '0 0 10px 0',
          fontWeight: 'bold'
        }}>
          💼 {getGradeMessage(grade)}
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          margin: '20px 0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#3b82f6', fontWeight: 'bold' }}>
              {vitalityIndex}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>地域活力指数</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#10b981', fontWeight: 'bold' }}>
              {riskScore}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>リスクスコア</div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 style={{ color: '#374151', marginBottom: '15px', fontSize: '1.1rem' }}>
          📋 投資推奨事項
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.map((rec, index) => (
            <div
              key={index}
              style={{
                background: '#f8fafc',
                padding: '15px',
                borderRadius: '10px',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                color: '#374151',
                borderLeft: `4px solid ${getGradeColor(grade)}`
              }}
            >
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EnhancedRegionalEconomicAnalysis: React.FC = () => {
  const { currentAddress } = useAddress();
  const [economicData, setEconomicData] = useState<RegionalEconomicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'demographics' | 'economy' | 'investment'>('overview');

  useEffect(() => {
    if (currentAddress) {
      analyzeRegionalEconomy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAddress]);

  const analyzeRegionalEconomy = async () => {
    if (!currentAddress) {
      setError('住所が設定されていません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🏛️ 実データ経済分析開始:', currentAddress);
      const data = await EnhancedRegionalEconomicService.analyzeRegionalEconomy(currentAddress);
      setEconomicData(data);
      console.log('✅ 実データ経済分析完了:', data);
    } catch (err) {
      console.error('❌ 実データ経済分析エラー:', err);
      setError(err instanceof Error ? err.message : '分析中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const testRealDataAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 実データAPI接続テスト開始');
      const response = await fetch('/api/test-real-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ APIテスト成功:', result);
        alert(`🎉 実データAPI接続テスト成功！\n\n接続状況:\n${Object.entries(result.tests).map(([key, value]: [string, any]) => 
          `- ${key}: ${value.status === 'success' ? '✅' : '❌'} ${value.message}`
        ).join('\n')}`);
      } else {
        throw new Error(result.error || 'APIテスト失敗');
      }
    } catch (err) {
      console.error('❌ APIテストエラー:', err);
      setError(err instanceof Error ? err.message : 'APIテスト中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (!currentAddress) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '20px', fontSize: '2rem' }}>
          🏛️ 地域経済分析システム
        </h2>
        <p style={{ color: '#6b7280', fontSize: '1.2rem' }}>
          分析を開始するには、まず住所を設定してください。
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* ヘッダー */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '25px',
        marginBottom: '40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        
        <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0', fontWeight: 'bold' }}>
          🏛️ 独自地域経済分析システム
        </h1>
        <p style={{ fontSize: '1.3rem', margin: '0 0 25px 0', opacity: 0.95 }}>
          複合データソース × AI分析による包括的地域評価
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '20px',
          borderRadius: '15px',
          fontSize: '1.2rem',
          fontWeight: '600',
          backdropFilter: 'blur(10px)'
        }}>
          📍 分析対象: {currentAddress}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '40px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[
          { id: 'overview', label: '📊 総合評価', color: '#667eea', desc: '地域活力・リスク評価' },
          { id: 'demographics', label: '👥 人口動態', color: '#10b981', desc: '人口推移・年齢構成' },
          { id: 'economy', label: '🏭 経済構造', color: '#f59e0b', desc: '産業・雇用状況' },
          { id: 'investment', label: '💼 投資判定', color: '#ef4444', desc: '投資推奨・リスク分析' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? tab.color : 'white',
              color: activeTab === tab.id ? 'white' : '#374151',
              border: `2px solid ${tab.color}`,
              padding: '15px 25px',
              borderRadius: '20px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '140px',
              boxShadow: activeTab === tab.id ? `0 4px 15px ${tab.color}40` : '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div>{tab.label}</div>
            <div style={{
              fontSize: '0.75rem',
              marginTop: '5px',
              opacity: 0.8,
              textAlign: 'center'
            }}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* 分析実行ボタン */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={analyzeRegionalEconomy}
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '18px 40px',
              borderRadius: '30px',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? '🔍 実データ分析中...' : '🚀 実データ経済分析を実行'}
          </button>
          
          <button
            onClick={() => testRealDataAPI()}
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #059669, #047857)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(5, 150, 105, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            🧪 API接続テスト
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '2px solid #fecaca',
          color: '#dc2626',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '30px',
          textAlign: 'center',
          fontSize: '1.1rem'
        }}>
          ❌ {error}
        </div>
      )}

      {/* 分析結果 */}
      {economicData && (
        <>
          {/* 総合評価タブ */}
          {activeTab === 'overview' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '30px',
                marginBottom: '40px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  border: '3px solid #3b82f6'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👶</div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold', 
                    color: '#3b82f6', 
                    marginBottom: '15px' 
                  }}>
                    {economicData.demographics.ageStructure.childrenRatio.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '10px' }}>
                    年少人口 (0-14歳)
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#059669', 
                    fontWeight: '600',
                    background: '#f0fdf4',
                    padding: '8px 12px',
                    borderRadius: '15px'
                  }}>
                    📊 国勢調査実データ
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  border: '3px solid #10b981'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💼</div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold', 
                    color: '#10b981', 
                    marginBottom: '15px' 
                  }}>
                    {economicData.demographics.ageStructure.workingRatio.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '10px' }}>
                    生産年齢人口 (15-64歳)
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#059669', 
                    fontWeight: '600',
                    background: '#f0fdf4',
                    padding: '8px 12px',
                    borderRadius: '15px'
                  }}>
                    📊 国勢調査実データ
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  border: '3px solid #f59e0b'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👴</div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold', 
                    color: '#f59e0b', 
                    marginBottom: '15px' 
                  }}>
                    {economicData.demographics.ageStructure.elderlyRatio.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '10px' }}>
                    老年人口 (65歳以上)
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#059669', 
                    fontWeight: '600',
                    background: '#f0fdf4',
                    padding: '8px 12px',
                    borderRadius: '15px'
                  }}>
                    📊 国勢調査実データ
                  </div>
                </div>
              </div>

              {/* 人口動態の詳細分析 */}
              <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ 
                  color: '#374151', 
                  marginBottom: '30px', 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  📈 人口動態詳細分析
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '25px'
                }}>
                  <div style={{
                    background: economicData.demographics.populationChange >= 0 
                      ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' 
                      : 'linear-gradient(135deg, #fef2f2, #fecaca)',
                    padding: '25px',
                    borderRadius: '15px',
                    border: `3px solid ${economicData.demographics.populationChange >= 0 ? '#10b981' : '#ef4444'}`
                  }}>
                    <h4 style={{ 
                      color: economicData.demographics.populationChange >= 0 ? '#065f46' : '#991b1b',
                      margin: '0 0 15px 0',
                      fontSize: '1.2rem',
                      fontWeight: '700'
                    }}>
                      年間人口変化率
                    </h4>
                    <div style={{
                      fontSize: '2.2rem',
                      fontWeight: 'bold',
                      color: economicData.demographics.populationChange >= 0 ? '#059669' : '#dc2626',
                      marginBottom: '10px'
                    }}>
                      {economicData.demographics.populationChange >= 0 ? '+' : ''}
                      {economicData.demographics.populationChange.toFixed(2)}%
                    </div>
                    <p style={{
                      fontSize: '1rem',
                      color: '#6b7280',
                      margin: '15px 0 0 0',
                      lineHeight: 1.5
                    }}>
                      {economicData.demographics.populationChange >= 0 ? 
                        '🚀 人口増加傾向。賃貸需要の持続的拡大が期待できます。' : 
                        '⚠️ 人口減少傾向。投資判断には慎重な検討が必要です。'
                      }
                    </p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    padding: '25px',
                    borderRadius: '15px',
                    border: '3px solid #6366f1'
                  }}>
                    <h4 style={{ 
                      color: '#374151', 
                      margin: '0 0 15px 0',
                      fontSize: '1.2rem',
                      fontWeight: '700'
                    }}>
                      転入超過数 (年間)
                    </h4>
                    <div style={{
                      fontSize: '2.2rem',
                      fontWeight: 'bold',
                      color: economicData.demographics.migrationBalance >= 0 ? '#059669' : '#dc2626',
                      marginBottom: '10px'
                    }}>
                      {economicData.demographics.migrationBalance >= 0 ? '+' : ''}
                      {Math.round(economicData.demographics.migrationBalance)}人
                    </div>
                    <p style={{
                      fontSize: '1rem',
                      color: '#6b7280',
                      margin: '15px 0 0 0',
                      lineHeight: 1.5
                    }}>
                      {economicData.demographics.migrationBalance >= 0 ? 
                        '📈 転入超過で活気のある地域です。魅力度が高い証拠。' : 
                        '📉 転出超過。地域魅力度向上が今後の課題です。'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 人口動態タブ */}
          {activeTab === 'demographics' && (
            <div>
              {/* 人口推移チャート */}
              {economicData.demographics.totalPopulation && (
                <AdvancedLineChart 
                  data={economicData.demographics.totalPopulation}
                  title="📈 人口推移 - 実データ分析"
                  color="#10b981"
                  showTrend={true}
                  unit="人"
                />
              )}
              
              {/* 年齢構成詳細 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '30px',
                marginBottom: '40px'
              }}>
                {/* 年少人口 */}
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  border: '3px solid #3b82f6',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👶</div>
                  <h3 style={{ 
                    color: '#3b82f6', 
                    marginBottom: '15px', 
                    fontSize: '1.3rem',
                    fontWeight: '700'
                  }}>
                    年少人口 (0-14歳)
                  </h3>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#3b82f6',
                    marginBottom: '10px'
                  }}>
                    {economicData.demographics.ageStructure.childrenRatio.toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    marginBottom: '15px'
                  }}>
                    {economicData.demographics.ageStructure.children.toLocaleString()}人
                  </div>
                  <div style={{
                    background: economicData.demographics.ageStructure.childrenRatio > 13 ? '#dcfce7' : '#fef2f2',
                    color: economicData.demographics.ageStructure.childrenRatio > 13 ? '#166534' : '#991b1b',
                    padding: '10px 15px',
                    borderRadius: '15px',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {economicData.demographics.ageStructure.childrenRatio > 13 ? 
                      '🌟 全国平均を上回る若い地域' : 
                      '📊 全国平均レベル'}
                  </div>
                </div>
                
                {/* 生産年齢人口 */}
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  border: '3px solid #10b981',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💼</div>
                  <h3 style={{ 
                    color: '#10b981', 
                    marginBottom: '15px', 
                    fontSize: '1.3rem',
                    fontWeight: '700'
                  }}>
                    生産年齢人口 (15-64歳)
                  </h3>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#10b981',
                    marginBottom: '10px'
                  }}>
                    {economicData.demographics.ageStructure.workingRatio.toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    marginBottom: '15px'
                  }}>
                    {economicData.demographics.ageStructure.working.toLocaleString()}人
                  </div>
                  <div style={{
                    background: economicData.demographics.ageStructure.workingRatio > 60 ? '#dcfce7' : '#fef2f2',
                    color: economicData.demographics.ageStructure.workingRatio > 60 ? '#166534' : '#991b1b',
                    padding: '10px 15px',
                    borderRadius: '15px',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {economicData.demographics.ageStructure.workingRatio > 60 ? 
                      '💪 労働力が豊富な地域' : 
                      '⚠️ 労働力不足の懸念'}
                  </div>
                </div>
                
                {/* 老年人口 */}
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  border: '3px solid #f59e0b',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👴</div>
                  <h3 style={{ 
                    color: '#f59e0b', 
                    marginBottom: '15px', 
                    fontSize: '1.3rem',
                    fontWeight: '700'
                  }}>
                    老年人口 (65歳以上)
                  </h3>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                    marginBottom: '10px'
                  }}>
                    {economicData.demographics.ageStructure.elderlyRatio.toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    marginBottom: '15px'
                  }}>
                    {economicData.demographics.ageStructure.elderly.toLocaleString()}人
                  </div>
                  <div style={{
                    background: economicData.demographics.ageStructure.elderlyRatio < 28 ? '#dcfce7' : '#fef2f2',
                    color: economicData.demographics.ageStructure.elderlyRatio < 28 ? '#166534' : '#991b1b',
                    padding: '10px 15px',
                    borderRadius: '15px',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {economicData.demographics.ageStructure.elderlyRatio < 28 ? 
                      '🌟 超高齢化が進行中' : 
                      '🚨 超高齢社会'}
                  </div>
                </div>
              </div>
              
              {/* 人口動態分析 */}
              <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                marginBottom: '30px'
              }}>
                <h3 style={{ 
                  color: '#374151', 
                  marginBottom: '30px', 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  📊 人口動態詳細分析
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '25px'
                }}>
                  {/* 人口密度 */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                    padding: '25px',
                    borderRadius: '15px',
                    border: '2px solid #0ea5e9'
                  }}>
                    <h4 style={{ 
                      color: '#0369a1', 
                      margin: '0 0 15px 0',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏘️ 人口密度
                    </h4>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: '#0369a1',
                      marginBottom: '10px'
                    }}>
                      {economicData.demographics.populationDensity.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '15px' }}>
                      人/km²
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      margin: 0,
                      lineHeight: 1.4
                    }}>
                      {economicData.demographics.populationDensity > 5000 ? 
                        '高密度な都市部。交通・商業利便性が高い地域です。' :
                        economicData.demographics.populationDensity > 1000 ?
                        '適度な人口密度。住環境と利便性のバランスが良好。' :
                        '低密度な地域。自然環境に恵まれた住環境です。'
                      }
                    </p>
                  </div>
                  
                  {/* 人口変化率 */}
                  <div style={{
                    background: economicData.demographics.populationChange >= 0 ? 
                      'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 
                      'linear-gradient(135deg, #fef2f2, #fecaca)',
                    padding: '25px',
                    borderRadius: '15px',
                    border: `2px solid ${economicData.demographics.populationChange >= 0 ? '#22c55e' : '#ef4444'}`
                  }}>
                    <h4 style={{ 
                      color: economicData.demographics.populationChange >= 0 ? '#15803d' : '#991b1b',
                      margin: '0 0 15px 0',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📈 年間人口変化率
                    </h4>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: economicData.demographics.populationChange >= 0 ? '#059669' : '#dc2626',
                      marginBottom: '10px'
                    }}>
                      {economicData.demographics.populationChange >= 0 ? '+' : ''}
                      {economicData.demographics.populationChange.toFixed(2)}%
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      margin: 0,
                      lineHeight: 1.4
                    }}>
                      {economicData.demographics.populationChange >= 0 ? 
                        '人口増加傾向。地域活力が維持されています。' :
                        economicData.demographics.populationChange >= -1 ?
                        '緩やかな人口減少。全国平均レベルです。' :
                        '人口減少が進行中。対策が必要な状況です。'
                      }
                    </p>
                  </div>
                  
                  {/* 転入超過数 */}
                  <div style={{
                    background: economicData.demographics.migrationBalance >= 0 ? 
                      'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 
                      'linear-gradient(135deg, #fef2f2, #fecaca)',
                    padding: '25px',
                    borderRadius: '15px',
                    border: `2px solid ${economicData.demographics.migrationBalance >= 0 ? '#22c55e' : '#ef4444'}`
                  }}>
                    <h4 style={{ 
                      color: economicData.demographics.migrationBalance >= 0 ? '#15803d' : '#991b1b',
                      margin: '0 0 15px 0',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏃 転入超過数
                    </h4>
                    <div style={{
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: economicData.demographics.migrationBalance >= 0 ? '#059669' : '#dc2626',
                      marginBottom: '10px'
                    }}>
                      {economicData.demographics.migrationBalance >= 0 ? '+' : ''}
                      {Math.round(economicData.demographics.migrationBalance)}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '15px' }}>
                      人/年
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      margin: 0,
                      lineHeight: 1.4
                    }}>
                      {economicData.demographics.migrationBalance >= 0 ? 
                        '転入超過で人気の地域。魅力度が高い証拠です。' :
                        '転出超過の状況。地域活性化が課題です。'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 投資への影響分析 */}
              <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ 
                  color: '#374151', 
                  marginBottom: '30px', 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  💼 不動産投資への影響分析
                </h3>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {[
                    {
                      title: '賃貸需要予測',
                      icon: '🏠',
                      content: economicData.demographics.ageStructure.workingRatio > 65 ? 
                        '生産年齢人口が多く、安定した賃貸需要が期待できます。' :
                        '生産年齢人口の減少により、賃貸需要は慎重に見極める必要があります。',
                      color: economicData.demographics.ageStructure.workingRatio > 65 ? '#059669' : '#d97706'
                    },
                    {
                      title: '将来性評価',
                      icon: '🚀',
                      content: economicData.demographics.populationChange >= 0 ? 
                        '人口増加地域として、長期的な資産価値上昇が期待できます。' :
                        '人口減少地域のため、出口戦略を慎重に検討する必要があります。',
                      color: economicData.demographics.populationChange >= 0 ? '#059669' : '#dc2626'
                    },
                    {
                      title: 'ターゲット層分析',
                      icon: '🎯',
                      content: economicData.demographics.ageStructure.childrenRatio > 13 ? 
                        'ファミリー層が多い地域。広めの間取りの需要が高い可能性があります。' :
                        '単身・高齢者世帯が中心。コンパクトな間取りや高齢者向け設備が重要です。',
                      color: '#3b82f6'
                    }
                  ].map((item, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                        padding: '25px',
                        borderRadius: '15px',
                        borderLeft: `5px solid ${item.color}`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '15px'
                      }}>
                        <div style={{
                          fontSize: '2rem',
                          flexShrink: 0
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 style={{
                            color: item.color,
                            margin: '0 0 10px 0',
                            fontSize: '1.2rem',
                            fontWeight: '700'
                          }}>
                            {item.title}
                          </h4>
                          <p style={{
                            color: '#374151',
                            margin: 0,
                            fontSize: '1rem',
                            lineHeight: 1.6
                          }}>
                            {item.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 経済構造タブ */}
          {activeTab === 'economy' && (
            <div>
              <InteractiveIndustryChart industries={economicData.economy.industryStructure} />
              
              {/* 事業所統計 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '30px',
                marginBottom: '40px'
              }}>
                {economicData.economy.businessEstablishments.slice(0, 6).map((business, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '20px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                        border: `3px solid ${color}20`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = `0 15px 40px ${color}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
                      }}
                    >
                      <h4 style={{ 
                        color: '#374151', 
                        marginBottom: '20px', 
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        borderBottom: `3px solid ${color}`,
                        paddingBottom: '10px'
                      }}>
                        {business.industry}
                      </h4>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px'
                      }}>
                        <span style={{ color: '#6b7280', fontSize: '1rem' }}>事業所数</span>
                        <span style={{ 
                          fontWeight: '700', 
                          color: '#374151',
                          fontSize: '1.1rem'
                        }}>
                          {business.establishments.toLocaleString()}
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '15px'
                      }}>
                        <span style={{ color: '#6b7280', fontSize: '1rem' }}>従業者数</span>
                        <span style={{ 
                          fontWeight: '700', 
                          color: '#374151',
                          fontSize: '1.1rem'
                        }}>
                          {business.employees.toLocaleString()}人
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <span style={{ color: '#6b7280', fontSize: '1rem' }}>成長率</span>
                        <span style={{
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          color: business.growthRate >= 0 ? '#059669' : '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          {business.growthRate >= 0 ? '📈' : '📉'}
                          {business.growthRate >= 0 ? '+' : ''}{business.growthRate.toFixed(1)}%
                        </span>
                      </div>
                      
                      {/* 業界健全性インジケーター */}
                      <div style={{
                        background: business.growthRate >= 0 ? '#f0fdf4' : '#fef2f2',
                        padding: '12px',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        color: business.growthRate >= 0 ? '#166534' : '#991b1b',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}>
                        {business.growthRate >= 3 ? '🏆 高成長産業' :
                         business.growthRate >= 0 ? '✅ 安定産業' :
                         business.growthRate >= -2 ? '⚠️ 要注意' : '🚨 衰退傾向'}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 経済指標サマリー */}
              <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ 
                  color: '#374151', 
                  marginBottom: '30px', 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  📊 経済指標サマリー
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '25px'
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '25px',
                    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                    borderRadius: '15px',
                    border: '2px solid #0ea5e9'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏢</div>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#0369a1',
                      marginBottom: '8px'
                    }}>
                      {economicData.economy.businessEstablishments.reduce((sum, item) => sum + item.establishments, 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#0369a1', fontWeight: '600' }}>
                      総事業所数
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '25px',
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    borderRadius: '15px',
                    border: '2px solid #22c55e'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#15803d',
                      marginBottom: '8px'
                    }}>
                      {economicData.economy.businessEstablishments.reduce((sum, item) => sum + item.employees, 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#15803d', fontWeight: '600' }}>
                      総従業者数
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '25px',
                    background: 'linear-gradient(135deg, #fefce8, #fef3c7)',
                    borderRadius: '15px',
                    border: '2px solid #eab308'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📈</div>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#a16207',
                      marginBottom: '8px'
                    }}>
                      {economicData.economy.economicGrowthRate.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '1rem', color: '#a16207', fontWeight: '600' }}>
                      平均成長率
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 投資判定タブ */}
          {activeTab === 'investment' && (
            <div>
              {/* AI投資推奨カード */}
              <AIRecommendationCard
                grade={economicData.analysis.overallGrade}
                recommendations={economicData.analysis.recommendations}
                vitalityIndex={economicData.analysis.vitalityIndex}
                riskScore={economicData.analysis.investmentRiskScore}
                futureProspects={economicData.analysis.futureProspects}
              />

              {/* 開発プロジェクト */}
              {economicData.realEstate.developmentProjects.length > 0 && (
                <div style={{
                  background: 'white',
                  padding: '40px',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  marginTop: '30px'
                }}>
                  <h3 style={{ 
                    color: '#374151', 
                    marginBottom: '30px', 
                    fontSize: '1.5rem', 
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    🏗️ 開発プロジェクト情報
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {economicData.realEstate.developmentProjects.map((project, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                          padding: '25px',
                          borderRadius: '15px',
                          border: '2px solid #e2e8f0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(10px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '15px'
                        }}>
                          <h4 style={{ 
                            color: '#374151', 
                            margin: 0, 
                            fontSize: '1.3rem',
                            fontWeight: '700'
                          }}>
                            🏗️ {project.name}
                          </h4>
                          <span style={{
                            background: project.impact === 'high' ? '#dc2626' : 
                                      project.impact === 'medium' ? '#d97706' : '#059669',
                            color: 'white',
                            padding: '8px 15px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '700'
                          }}>
                            {project.impact === 'high' ? '🔥 高影響' : 
                             project.impact === 'medium' ? '⚡ 中影響' : '✅ 低影響'}
                          </span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '15px',
                          fontSize: '1rem',
                          color: '#6b7280'
                        }}>
                          <div>
                            <strong style={{ color: '#374151' }}>種別:</strong> {project.type}
                          </div>
                          <div>
                            <strong style={{ color: '#374151' }}>状況:</strong> {project.status}
                          </div>
                          <div>
                            <strong style={{ color: '#374151' }}>完成予定:</strong> {project.expectedCompletion}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 不動産市場データ */}
              <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                marginTop: '30px'
              }}>
                <h3 style={{ 
                  color: '#374151', 
                  marginBottom: '30px', 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  🏠 不動産市場データ
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '25px'
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '25px',
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    borderRadius: '15px',
                    border: '2px solid #f59e0b'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📈</div>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#a16207',
                      marginBottom: '8px'
                    }}>
                      {economicData.realEstate.priceChangeRate >= 0 ? '+' : ''}
                      {economicData.realEstate.priceChangeRate.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '1rem', color: '#a16207', fontWeight: '600' }}>
                      地価変動率
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '25px',
                    background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
                    borderRadius: '15px',
                    border: '2px solid #0ea5e9'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏢</div>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#0369a1',
                      marginBottom: '8px'
                    }}>
                      {economicData.realEstate.transactionVolume.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#0369a1', fontWeight: '600' }}>
                      年間取引件数
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedRegionalEconomicAnalysis;
