import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAddress } from '../context/AddressContext';
import { CrimeStatisticsAPIService, ComprehensiveCrimeData, SafetyScore } from '../services/CrimeStatisticsAPIService';

const CrimeSafetyAnalysis: React.FC = () => {
  const { currentAddress, coordinates } = useAddress();
  const [crimeData, setCrimeData] = useState<ComprehensiveCrimeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'patterns' | 'recommendations'>('overview');

  useEffect(() => {
    if (currentAddress && coordinates) {
      fetchCrimeData();
    }
  }, [currentAddress, coordinates]);

  const fetchCrimeData = async () => {
    if (!currentAddress || !coordinates) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🚓 犯罪・安全性分析開始:', currentAddress);
      const data = await CrimeStatisticsAPIService.fetchComprehensiveCrimeData(coordinates, currentAddress);
      setCrimeData(data);
    } catch (err) {
      console.error('犯罪データ取得エラー:', err);
      setError('犯罪統計データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#28a745'; // 緑
    if (score >= 60) return '#ffc107'; // 黄
    return '#dc3545'; // 赤
  };

  const getGradeColor = (grade: string): string => {
    const colors = {
      'S': '#28a745',
      'A': '#6f42c1',
      'B': '#007bff',
      'C': '#ffc107',
      'D': '#fd7e14',
      'E': '#dc3545'
    };
    return colors[grade as keyof typeof colors] || '#6c757d';
  };

  const formatHourlyData = () => {
    if (!crimeData?.timePatterns?.hourlyRisk) return [];
    
    return crimeData.timePatterns.hourlyRisk.map((risk, hour) => ({
      hour: `${hour}:00`,
      リスク値: Math.round(risk),
      時間帯: hour < 6 ? '深夜' : hour < 12 ? '午前' : hour < 18 ? '午後' : '夜間'
    }));
  };

  const formatDayOfWeekData = () => {
    if (!crimeData?.timePatterns?.dayOfWeekRisk) return [];
    
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return crimeData.timePatterns.dayOfWeekRisk.map((risk, index) => ({
      曜日: days[index],
      リスク値: Math.round(risk)
    }));
  };

  const formatRadarData = () => {
    if (!crimeData?.safetyScore.breakdown) return [];

    return [
      {
        category: '凶悪犯罪対策',
        score: crimeData.safetyScore.breakdown.violentCrime,
        fullMark: 100
      },
      {
        category: '財産犯罪対策',
        score: crimeData.safetyScore.breakdown.propertyCrime,
        fullMark: 100
      },
      {
        category: '街頭犯罪対策',
        score: crimeData.safetyScore.breakdown.streetCrime,
        fullMark: 100
      },
      {
        category: '交通安全',
        score: crimeData.safetyScore.breakdown.trafficSafety,
        fullMark: 100
      },
      {
        category: '公共秩序',
        score: crimeData.safetyScore.breakdown.publicOrder,
        fullMark: 100
      }
    ];
  };

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 総合安全性スコア */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '2px solid #f0f0f0'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#374151',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          🛡️ 総合安全性評価
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          {/* メインスコア */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '128px',
              height: '128px',
              margin: '0 auto',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.875rem',
              fontWeight: 'bold',
              marginBottom: '16px',
              backgroundColor: getScoreColor(crimeData?.safetyScore.overallScore || 0)
            }}>
              {crimeData?.safetyScore.overallScore || 0}
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>総合スコア</div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginTop: '8px',
              color: getGradeColor(crimeData?.safetyScore.grade || 'E')
            }}>
              {crimeData?.safetyScore.grade} ランク
            </div>
          </div>

          {/* リスクレベル */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
              {crimeData?.safetyScore.riskLevel === '低リスク' ? '🟢' : 
               crimeData?.safetyScore.riskLevel === '中リスク' ? '🟡' : '🔴'}
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>リスクレベル</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '8px', color: '#374151' }}>
              {crimeData?.safetyScore.riskLevel || '不明'}
            </div>
          </div>

          {/* 地域比較 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>全国比較</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '8px', color: '#2563eb' }}>
              {crimeData?.safetyScore.overallScore && crimeData.safetyScore.overallScore >= 70 ? '平均以上' : '平均以下'}
            </div>
          </div>
        </div>
      </div>

      {/* レーダーチャート */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>安全性詳細分析</h4>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadarChart width={500} height={400} data={formatRadarData()}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar
              name="安全性スコア"
              dataKey="score"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Tooltip />
          </RadarChart>
        </div>
      </div>

      {/* 推奨事項 */}
      <div style={{
        background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
        padding: '24px',
        borderRadius: '12px',
        borderLeft: '4px solid #3b82f6'
      }}>
        <h4 style={{
          fontSize: '1.125rem',
          fontWeight: 'bold',
          color: '#1e40af',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          💡 安全対策推奨事項
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(crimeData?.safetyScore.recommendations || []).map((recommendation, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#3b82f6', marginTop: '4px' }}>•</span>
              <span style={{ color: '#374151' }}>{recommendation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 犯罪統計詳細 */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>犯罪種別統計</h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            background: '#fef2f2',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
              {crimeData?.nationalStats?.violentCrimes || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>凶悪犯罪</div>
            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>件/年</div>
          </div>
          
          <div style={{
            background: '#fff7ed',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #f97316'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ea580c' }}>
              {crimeData?.nationalStats?.propertyCrimes || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>財産犯罪</div>
            <div style={{ fontSize: '0.75rem', color: '#f97316', marginTop: '4px' }}>件/年</div>
          </div>
          
          <div style={{
            background: '#fefce8',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #eab308'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ca8a04' }}>
              {crimeData?.localCrime?.streetCrimes || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>街頭犯罪</div>
            <div style={{ fontSize: '0.75rem', color: '#eab308', marginTop: '4px' }}>近隣地域</div>
          </div>
          
          <div style={{
            background: '#eff6ff',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
              {crimeData?.trafficSafety?.totalAccidents || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>交通事故</div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '4px' }}>件/年</div>
          </div>
        </div>
      </div>

      {/* 窃盗詳細 */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>窃盗犯罪詳細</h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ background: '#faf5ff', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#7c3aed' }}>
              {crimeData?.localCrime?.bicycleTheft || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>自転車盗</div>
          </div>
          
          <div style={{ background: '#eef2ff', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4f46e5' }}>
              {crimeData?.localCrime?.carTheft || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>車両盗</div>
          </div>
          
          <div style={{ background: '#fdf2f8', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ec4899' }}>
              {crimeData?.localCrime?.burglary || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>住居侵入</div>
          </div>
        </div>
      </div>

      {/* 交通安全詳細 */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>交通安全統計</h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
              {crimeData?.trafficSafety?.fatalAccidents || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>死亡事故</div>
          </div>
          
          <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ea580c' }}>
              {crimeData?.trafficSafety?.injuryAccidents || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>負傷事故</div>
          </div>
          
          <div style={{ background: '#fefce8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ca8a04' }}>
              {crimeData?.trafficSafety?.pedestrianAccidents || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>歩行者事故</div>
          </div>
          
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
              {crimeData?.trafficSafety?.bicycleAccidents || 0}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>自転車事故</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 時間帯別リスク */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>時間帯別リスク分析</h4>
        <div style={{ height: '320px', overflow: 'hidden' }}>
          <LineChart width={800} height={300} data={formatHourlyData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="リスク値" 
              stroke="#dc3545" 
              strokeWidth={3}
              dot={{ fill: '#dc3545', r: 4 }}
            />
          </LineChart>
        </div>
        <div style={{ marginTop: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
          💡 深夜時間帯（22:00-06:00）は特に注意が必要です
        </div>
      </div>

      {/* 曜日別リスク */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>曜日別リスク分析</h4>
        <div style={{ height: '320px', overflow: 'hidden' }}>
          <BarChart width={800} height={300} data={formatDayOfWeekData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="曜日" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="リスク値" fill="#ffc107" />
          </BarChart>
        </div>
      </div>

      {/* 季節別トレンド */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>季節別犯罪トレンド</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ background: '#fdf2f8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🌸</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#ec4899' }}>
              {Math.round(crimeData?.timePatterns?.seasonalTrends.spring || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>春季リスク</div>
          </div>
          
          <div style={{ background: '#fefce8', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>☀️</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#ca8a04' }}>
              {Math.round(crimeData?.timePatterns?.seasonalTrends.summer || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>夏季リスク</div>
          </div>
          
          <div style={{ background: '#fff7ed', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🍂</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#ea580c' }}>
              {Math.round(crimeData?.timePatterns?.seasonalTrends.autumn || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>秋季リスク</div>
          </div>
          
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>❄️</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2563eb' }}>
              {Math.round(crimeData?.timePatterns?.seasonalTrends.winter || 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>冬季リスク</div>
          </div>
        </div>
      </div>

      {/* リスクピークタイム */}
      <div style={{
        background: '#fef2f2',
        padding: '24px',
        borderRadius: '12px',
        borderLeft: '4px solid #ef4444'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#991b1b', marginBottom: '16px' }}>⚠️ 高リスク時間帯</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(crimeData?.timePatterns?.riskPeakTimes || []).map((time, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>🚨</span>
              <span style={{ color: '#374151', fontWeight: '500' }}>{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 総合推奨事項 */}
      <div style={{
        background: '#dbeafe',
        padding: '24px',
        borderRadius: '12px',
        borderLeft: '4px solid #3b82f6'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '16px' }}>🛡️ 総合安全対策</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(crimeData?.safetyScore.recommendations || []).map((recommendation, index) => (
            <div key={index} style={{
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#3b82f6', fontSize: '1.25rem' }}>💡</span>
                <span style={{ color: '#374151' }}>{recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 具体的対策 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>🚨 防犯対策</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              '玄関・窓の施錠確認',
              '防犯カメラ・センサーライト設置',
              '近隣との連携・コミュニケーション',
              '貴重品の適切な管理'
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ fontSize: '0.875rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>🚶‍♀️ 外出時の注意</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              '夜間の一人歩きを避ける',
              '明るい道・人通りの多い道を選ぶ',
              'イヤホン使用時の周囲への注意',
              '緊急連絡先の事前確認'
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b' }}>⚠️</span>
                <span style={{ fontSize: '0.875rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 地域特有の対策 */}
      <div style={{
        background: '#f3e8ff',
        padding: '24px',
        borderRadius: '12px',
        borderLeft: '4px solid #8b5cf6'
      }}>
        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#6b46c1', marginBottom: '16px' }}>🏘️ 地域特有の対策</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <h5 style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>自転車盗対策</h5>
            <ul style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, paddingLeft: '16px' }}>
              <li>二重ロック（チェーン＋U字ロック）</li>
              <li>駐輪場の利用</li>
              <li>防犯登録の確認</li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>交通安全対策</h5>
            <ul style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, paddingLeft: '16px' }}>
              <li>危険な交差点の把握</li>
              <li>夜間の視認性向上</li>
              <li>交通ルールの遵守</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  if (!currentAddress) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏠</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>住所を設定してください</h2>
        <p style={{ color: '#6b7280' }}>ホーム画面で住所を入力すると、犯罪・安全性分析を開始できます。</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1536px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
          🚓 犯罪・安全性分析
        </h1>
        <p style={{ color: '#6b7280' }}>
          対象地域: <span style={{ fontWeight: '600', color: '#2563eb' }}>{currentAddress}</span>
        </p>
      </div>

      {/* タブナビゲーション */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { id: 'overview', label: '🛡️ 総合評価', icon: '🛡️' },
            { id: 'details', label: '📊 詳細統計', icon: '📊' },
            { id: 'patterns', label: '⏰ 時間パターン', icon: '⏰' },
            { id: 'recommendations', label: '💡 対策提案', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.2s',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === tab.id ? '#3b82f6' : '#f3f4f6',
                color: activeTab === tab.id ? 'white' : '#374151',
                boxShadow: activeTab === tab.id ? '0 4px 8px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分析実行ボタン */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={fetchCrimeData}
          disabled={loading}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            boxShadow: loading ? 'none' : '0 4px 8px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          {loading ? '🔄 分析中...' : '🚓 犯罪・安全性分析を実行'}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#ef4444', fontSize: '1.25rem', marginRight: '8px' }}>⚠️</span>
            <span style={{ color: '#991b1b' }}>{error}</span>
          </div>
        </div>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔄</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>犯罪統計データを分析中...</div>
            <div style={{ color: '#6b7280', marginTop: '8px' }}>公的データベースから情報を取得しています</div>
          </div>
        </div>
      )}

      {/* 分析結果表示 */}
      {crimeData && !loading && (
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'details' && renderDetails()}
          {activeTab === 'patterns' && renderPatterns()}
          {activeTab === 'recommendations' && renderRecommendations()}
        </div>
      )}

      {/* データソース情報 */}
      {crimeData && (
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>📊 データソース</h4>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <div style={{ marginBottom: '4px' }}>• 警察庁犯罪統計: 全国・都道府県別犯罪統計</div>
            <div style={{ marginBottom: '4px' }}>• 東京都オープンデータ: リアルタイム犯罪発生情報</div>
            <div style={{ marginBottom: '4px' }}>• e-Stat政府統計: 交通事故統計データ</div>
            <div>• 最終更新: {new Date().toLocaleDateString('ja-JP')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrimeSafetyAnalysis;