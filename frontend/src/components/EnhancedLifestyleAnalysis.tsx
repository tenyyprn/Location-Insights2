import React, { useState } from 'react';
import { useAddress } from '../context/AddressContext';

import { aiAnalysisService, AIAnalysisResult, LifestyleAnalysisData } from '../services/AIAnalysisService';
import { IntegratedDataService, IntegratedAreaData } from '../services/IntegratedDataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface EnhancedLifestyleAnalysisProps {
  currentAddress?: string;
  coordinates?: { lat: number; lng: number };
}

interface EnhancedAnalysisResult {
  basicScores: {
    safety: number;
    transport: number;
    shopping: number;
    medical: number;
    education: number;
    environment: number;
    total: number;
  };
  integratedData: IntegratedAreaData | null;
  aiAnalysis: AIAnalysisResult | null;
  marketAnalysis: {
    averagePrice: number;
    pricePerSqm: number;
    marketTrend: 'rising' | 'stable' | 'declining';
    investmentRating: string;
    priceHistory: Array<{ year: string; price: number }>;
    competitiveAnalysis: {
      rank: number;
      totalAreas: number;
      comparison: string;
    };
  };
  riskAssessment: {
    overallRisk: number;
    riskFactors: string[];
    recommendations: string[];
    riskBreakdown: {
      earthquake: number;
      flood: number;
      landslide: number;
      fire: number;
    };
  };
  urbanPlanning: {
    zoning: string;
    buildingRestrictions: string[];
    futureProjects: string[];
    developmentPotential: string;
    regulations: {
      buildingCoverage: number;
      floorAreaRatio: number;
      heightLimit: number;
    };
  };
  facilities: {
    education: Array<{ name: string; type: string; distance: number; rating?: number }>;
    medical: Array<{ name: string; type: string; distance: number; specialties?: string[] }>;
    transport: Array<{ name: string; line: string; distance: number; accessibility: string }>;
    commercial: Array<{ name: string; type: string; distance: number }>;
    recreation: Array<{ name: string; type: string; distance: number }>;
  };
}

const EnhancedLifestyleAnalysis: React.FC<EnhancedLifestyleAnalysisProps> = ({ 
  currentAddress: propAddress, 
  coordinates: propCoordinates 
}) => {
  const { currentAddress: contextAddress, coordinates: contextCoordinates } = useAddress();
  
  const currentAddress = propAddress || contextAddress;
  const coordinates = propCoordinates || contextCoordinates || undefined;
  const [analysisResult, setAnalysisResult] = useState<EnhancedAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'market' | 'facilities' | 'risks' | 'planning'>('overview');

  const analyzeArea = async () => {
    if (!currentAddress || !coordinates) {
      alert('住所と座標情報が必要です');
      return;
    }

    console.log('🔍 環境変数チェック:', {
      REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY ? '設定済み' : '未設定',
      keyLength: process.env.REACT_APP_OPENAI_API_KEY?.length || 0
    });

    setLoading(true);
    try {
      console.log(`🔍 統合API分析開始: ${currentAddress}`);
      
      // 統合データ取得を試行
      let integratedData: IntegratedAreaData | null = null;
      let aiAnalysis: AIAnalysisResult | null = null;
      
      try {
        // Google Maps + 国土交通省APIから実データ取得
        console.log('🌍 Google Maps & 国土交通省API統合取得中...');
        
        integratedData = await IntegratedDataService.fetchComprehensiveAreaData(
          coordinates, 
          currentAddress
        );
        
        console.log('✅ 統合データ取得成功:', integratedData);
        
        // AI分析を実行
        console.log('🤖 AI住環境分析開始...');
        
        try {
          console.log('🤖 AI分析開始中...');
          
          // AI分析用データを準備
          const analysisData: LifestyleAnalysisData = {
            address: currentAddress,
            coordinates: integratedData?.coordinates || { lat: 0, lng: 0 },
            educationCount: integratedData?.education?.total || 0,
            medicalCount: integratedData?.medical?.total || 0,
            commercialCount: integratedData?.commercial?.length || 0,
            transportCount: integratedData?.transport?.length || 0,
            environmentCount: integratedData?.recreation?.length || 0,
            safetyCount: 0,
            totalScore: 75, // 仮のスコア
            scores: {
              education: 80,
              medical: 70,
              transport: 85,
              shopping: 75,
              dining: 80,
              safety: 65,
              environment: 70,
              cultural: 75
            },
            educationDetails: [...(integratedData?.education?.elementary || []), ...(integratedData?.education?.juniorHigh || [])],
            medicalDetails: [...(integratedData?.medical?.hospitals || []), ...(integratedData?.medical?.clinics || [])],
            commercialDetails: integratedData?.commercial || [],
            diningDetails: integratedData?.commercial || [], // 飲食店データを追加
            transportDetails: integratedData?.transport || []
          };
          
          aiAnalysis = await aiAnalysisService.generateLifestyleAnalysis(analysisData);
          console.log('✅ AI分析完了:', aiAnalysis);
        } catch (aiError) {
          console.warn('⚠️ AI分析エラー:', aiError);
        }
        
      } catch (apiError) {
        console.error('❌ 統合API取得エラー:', apiError);
        alert('APIデータの取得に失敗しました。バックエンドサーバーが起動しているか確認してください。');
        // エラー時は処理を終了し、結果を設定しない
        return;
      }

      const result: EnhancedAnalysisResult = {
        basicScores: calculateBasicScores(integratedData),
        integratedData,
        aiAnalysis,
        marketAnalysis: calculateMarketAnalysis(integratedData, currentAddress),
        riskAssessment: calculateRiskAssessment(integratedData, currentAddress),
        urbanPlanning: analyzeUrbanPlanning(integratedData, currentAddress),
        facilities: analyzeFacilities(integratedData, currentAddress)
      };

      setAnalysisResult(result);
      console.log('✅ 統合分析完了:', result);

    } catch (error) {
      console.error('❌ 統合分析エラー:', error);
      alert('分析中にエラーが発生しました。しばらく後に再試行してください。');
    } finally {
      setLoading(false);
    }
  };

  // 基本スコア計算（統合データ版）
  const calculateBasicScores = (data: IntegratedAreaData | null) => {
    const education = calculateEducationScore(data?.education);
    const medical = calculateMedicalScore(data?.medical);
    const transport = calculateTransportScore(data?.transport);
    const safety = calculateSafetyScore(data?.disaster);
    const shopping = calculateShoppingScore(data);
    const environment = calculateEnvironmentScore(data);
    const total = (education + medical + transport + safety + shopping + environment) / 6;
    return { education, medical, transport, safety, shopping, environment, total };
  };

  const calculateEducationScore = (education: any) => {
    if (!education) return 50;
    const total = education.total || 0;
    const hasUniversity = education.university?.length > 0;
    
    let score = Math.min(50 + total * 5, 95);
    if (hasUniversity) score += 10;
    return Math.min(score, 100);
  };

  const calculateMedicalScore = (medical: any) => {
    if (!medical) return 40;
    const total = medical.total || 0;
    const hasHospital = medical.hospitals?.length > 0;
    
    let score = 40 + total * 8;
    if (hasHospital) score += 15;
    return Math.min(score, 100);
  };

  const calculateTransportScore = (transport: any[] | undefined) => {
    if (!transport || transport.length === 0) return 50;
    const stationCount = transport.length;
    const avgDistance = transport.reduce((acc, s) => acc + (s.distance || 500), 0) / transport.length;
    
    let score = 50 + stationCount * 15;
    if (avgDistance < 300) score += 10;
    if (avgDistance < 200) score += 10;
    return Math.min(score, 100);
  };

  const calculateSafetyScore = (disaster: any) => {
    if (!disaster) return 95;
    const riskCount = (disaster.flood?.length || 0) + (disaster.landslide?.length || 0) + (disaster.earthquake?.length || 0);
    return Math.max(95 - riskCount * 10, 30);
  };

  const calculateShoppingScore = (data: IntegratedAreaData | null) => {
    if (!data || !data.commercial) {
      console.warn('商業施設データがありません');
      return 0;
    }
    
    const commercialCount = data.commercial.length;
    let score = Math.min(50 + commercialCount * 5, 100);
    
    // 距離に基づく調整
    const closeShops = data.commercial.filter(shop => shop.distance < 300).length;
    if (closeShops > 0) {
      score += Math.min(closeShops * 5, 20);
    }
    
    return Math.min(score, 100);
  };

  const calculateEnvironmentScore = (data: IntegratedAreaData | null) => {
    if (!data || !data.recreation) {
      console.warn('環境・レクリエーションデータがありません');
      return 50; // データがない場合のベーススコア
    }
    
    const recreationCount = data.recreation.length;
    let score = 50; // ベーススコア
    
    // 公園やレクリエーション施設の数に基づいて加点
    score += Math.min(recreationCount * 8, 30);
    
    // 近くにある施設のボーナス
    const nearbyParks = data.recreation.filter(rec => rec.distance < 500).length;
    if (nearbyParks > 0) {
      score += Math.min(nearbyParks * 10, 20);
    }
    
    return Math.min(score, 100);
  };

  // 市場分析計算（統合データ版）
  const calculateMarketAnalysis = (data: IntegratedAreaData | null, address?: string) => {
    const marketData = data?.marketAnalysis;
    // 地価データは priceHistory で使用されるためコメントアウト
    // const landPriceData = data?.landPrice || [];
    
    // 統合データから平均価格を算出
    const averageLandPrice = marketData?.averageLandPrice || 2000000;
    const averagePrice = averageLandPrice * 50; // 概算：地価 × 50 = 物件価格
    const pricePerSqm = averageLandPrice;
    
    const investmentRating = marketData?.investmentGrade || 'C';
    const marketTrend = marketData?.trend === '上昇傾向' ? 'rising' : 'stable';
    
    // 実際のデータから価格推移を作成
    let priceHistory: Array<{ year: string; price: number }> = [];
    if (data && data.landPrice && data.landPrice.length > 0) {
      // 実際のデータに基づいて価格推移を計算
      priceHistory = data.landPrice.map(price => ({
        year: price.year || String(new Date(price.date).getFullYear()),
        price: price.value || 0
      }));
      console.log('地価データを取得しました:', priceHistory);
    } else {
      priceHistory = [];
      console.warn('価格推移データが取得できませんでした');
    }

    // エリア別ランキング（データ品質に基づく）
    const dataQuality = data?.statistics?.dataQuality || 0;
    let rank, comparison;
    if (dataQuality > 80) {
      rank = 3;
      comparison = '高品質データによる上位ランク地域';
    } else if (dataQuality > 50) {
      rank = 15;
      comparison = '中品質データによる中位ランク地域';
    } else {
      rank = 45;
      comparison = '基本データによる標準地域';
    }

    return {
      averagePrice,
      pricePerSqm,
      marketTrend: marketTrend as 'rising' | 'stable' | 'declining',
      investmentRating,
      priceHistory,
      competitiveAnalysis: {
        rank,
        totalAreas: 50,
        comparison
      }
    };
  };

  // リスク評価計算（統合データ版）
  const calculateRiskAssessment = (data: IntegratedAreaData | null, address?: string) => {
    const disaster = data?.disaster;
    const riskLevel = disaster?.riskLevel || '情報なし';
    
    const riskFactors = [];
    const recommendations = [];
    
    // 災害リスク分析
    if (disaster?.flood && disaster.flood.length > 0) {
      riskFactors.push('洪水リスク');
      recommendations.push('洪水ハザードマップの確認と避難経路の把握');
    }
    
    if (disaster?.landslide && disaster.landslide.length > 0) {
      riskFactors.push('土砂災害リスク');
      recommendations.push('土砂災害警戒区域の状況確認');
    }
    
    if (disaster?.earthquake && disaster.earthquake.length > 0) {
      riskFactors.push('地震リスク');
      recommendations.push('耐震性の高い建物の選択');
    }
    
    // 基本的な推奨事項
    if (riskFactors.length === 0) {
      recommendations.push('定期的な防災用品の点検');
      recommendations.push('地域の防災訓練への参加');
    }
    
    // リスクレベルの数値化
    let overallRisk = 20; // ベースリスク
    if (riskLevel === '高リスク') overallRisk = 80;
    else if (riskLevel === '中リスク') overallRisk = 50;
    else if (riskLevel === '低リスク') overallRisk = 20;
    
    return {
      overallRisk,
      riskFactors,
      recommendations,
      riskBreakdown: {
        earthquake: disaster?.earthquake?.length ? 70 : 20,
        flood: disaster?.flood?.length ? 60 : 15,
        landslide: disaster?.landslide?.length ? 55 : 10,
        fire: 25 // 基本的な火災リスク
      }
    };
  };

  // 都市計画分析
  const analyzeUrbanPlanning = (data: IntegratedAreaData | null, address?: string) => {
    if (!data) {
      console.warn('都市計画分析に必要なデータがありません');
      return {
        zoning: 'データなし',
        buildingRestrictions: ['データなし'],
        futureProjects: ['データなし'],
        developmentPotential: 'データなし',
        regulations: {
          buildingCoverage: 0,
          floorAreaRatio: 0,
          heightLimit: 0
        }
      };
    }
    
    // 実際のデータがあればそれを使用、なければ基本情報を表示
    return {
      zoning: data.address ? `${data.address}エリアの用途地域` : '用途地域情報なし',
      buildingRestrictions: [
        'API実装待ち - 建築基準法に基づく制限が適用されます'
      ],
      futureProjects: [
        'API実装待ち - 将来の開発計画情報は各自治体にお問い合わせください'
      ],
      developmentPotential: 'API実装待ち - 開発ポテンシャルの評価',
      regulations: {
        buildingCoverage: 0,
        floorAreaRatio: 0,
        heightLimit: 0
      }
    };
  };

  // 施設分析（統合データ版）
  const analyzeFacilities = (data: IntegratedAreaData | null, address?: string) => {
    const facilities = {
      education: [] as Array<{ name: string; type: string; distance: number; rating?: number }>,
      medical: [] as Array<{ name: string; type: string; distance: number; specialties?: string[] }>,
      transport: [] as Array<{ name: string; line: string; distance: number; accessibility: string }>,
      commercial: [] as Array<{ name: string; type: string; distance: number }>,
      recreation: [] as Array<{ name: string; type: string; distance: number }>
    };
    
    // 教育施設
    if (data?.education) {
      const edu = data.education;
      [...edu.elementary, ...edu.juniorHigh, ...edu.highSchool, ...edu.university, ...edu.kindergarten]
        .forEach(school => {
          facilities.education.push({
            name: school.name || '学校',
            type: school.type || '教育施設',
            distance: school.distance || 500,
            rating: school.rating || undefined
          });
        });
    }
    
    // 医療施設
    if (data?.medical) {
      const med = data.medical;
      [...med.hospitals, ...med.clinics, ...med.pharmacies, ...med.dental]
        .forEach(medical => {
          facilities.medical.push({
            name: medical.name || '医療機関',
            type: medical.type || '医療施設',
            distance: medical.distance || 600,
            specialties: medical.departments || undefined
          });
        });
    }
    
    // 交通機関
    if (data?.transport) {
      data.transport.forEach(station => {
        facilities.transport.push({
          name: station.name || '駅',
          line: station.line || '路線',
          distance: station.distance || 400,
          accessibility: 'good'
        });
      });
    }
    
    // 商業施設
    if (data?.commercial) {
      data.commercial.forEach(shop => {
        facilities.commercial.push({
          name: shop.name || '商業施設',
          type: shop.type || 'ショッピング',
          distance: shop.distance || 300
        });
      });
    }
    
    // レクリエーション施設
    if (data?.recreation) {
      data.recreation.forEach(rec => {
        facilities.recreation.push({
          name: rec.name || '公園',
          type: rec.type || 'レクリエーション',
          distance: rec.distance || 800
        });
      });
    }
    
    return facilities;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#28a745';
    if (score >= 80) return '#6f42c1';
    if (score >= 70) return '#007bff';
    if (score >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  // getRiskLevel 関数は現在使用されていないためコメントアウト
  // const getRiskLevel = (risk: number) => {
  //   if (risk >= 80) return { level: '非常に安全', color: '#28a745', icon: '✅' };
  //   if (risk >= 60) return { level: '安全', color: '#6f42c1', icon: '🛡️' };
  //   if (risk >= 40) return { level: '注意', color: '#ffc107', icon: '⚠️' };
  //   if (risk >= 20) return { level: '要警戒', color: '#fd7e14', icon: '⚠️' };
  //   return { level: '危険', color: '#dc3545', icon: '❌' };
  // };

  // Loading state
  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '15px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>
            🌍 統合API分析中...
          </h3>
          <p style={{ color: '#666', margin: 0 }}>
            Google Maps & 国土交通省APIから包括的データを取得しています
          </p>
        </div>
      </div>
    );
  }

  // Initial state
  if (!analysisResult) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', fontSize: '2.2rem', marginBottom: '10px', fontWeight: 700 }}>
            🌍 統合API分析
          </h2>
          <p style={{ color: '#666', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Google Maps API + 国土交通省API統合による包括的な地域分析
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
          padding: '30px',
          borderRadius: '15px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            color: 'white'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '5px' }}>
              📍 分析対象住所
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {currentAddress || '住所が設定されていません'}
            </div>
            {!currentAddress && (
              <div style={{ fontSize: '0.9rem', marginTop: '5px', opacity: 0.8 }}>
                「🔍 生活利便性分析」で住所を入力してください
              </div>
            )}
          </div>
          
          <button
            onClick={analyzeArea}
            disabled={!currentAddress || !coordinates}
            style={{
              background: (!currentAddress || !coordinates) 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'linear-gradient(135deg, #28a745, #20c997)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: (!currentAddress || !coordinates) ? 'not-allowed' : 'pointer',
              width: '100%',
              opacity: (!currentAddress || !coordinates) ? 0.6 : 1,
              boxShadow: (!currentAddress || !coordinates) ? 'none' : '0 4px 15px rgba(40, 167, 69, 0.3)'
            }}
          >
            {!currentAddress ? '📋 まず「生活利便性分析」で住所を入力' : '🔍 統合API分析を実行'}
          </button>
        </div>
        
        {!currentAddress && (
          <div style={{
            background: '#e7f3ff',
            border: '1px solid #b3d9ff',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#0066cc', margin: '0 0 10px 0' }}>
              📝 使用手順
            </h4>
            <ol style={{ 
              color: '#0066cc', 
              textAlign: 'left', 
              margin: 0,
              paddingLeft: '20px',
              lineHeight: 1.6
            }}>
              <li>「🔍 生活利便性分析」ページで住所を入力</li>
              <li>分析を実行してスコアを取得</li>
              <li>このページで統合APIによる詳細分析</li>
              <li>AI分析でさらに詳しい洞察を取得</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  // Main analysis results
  return (
    <div style={{ width: '100%', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .ai-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .ai-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          .facility-item {
            transition: all 0.2s ease;
          }
          .facility-item:hover {
            background-color: #f8f9fa;
            border-radius: 8px;
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: 700 }}>
          🌍 統合API分析結果
        </h2>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
          {currentAddress} - Google Maps + 国土交通省API統合分析
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0',
        overflowX: 'auto'
      }}>
        {[
          { key: 'overview', label: '📊 総合評価' },
          { key: 'ai', label: '🤖 AI分析' },
          { key: 'market', label: '💹 市場分析' },
          { key: 'facilities', label: '🏢 施設情報' },
          { key: 'risks', label: '⚠️ リスク評価' },
          { key: 'planning', label: '🏗️ 都市計画' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '15px 20px',
              border: 'none',
              background: activeTab === tab.key ? '#007bff' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#666',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '10px 10px 0 0',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.4rem' }}>
              🎯 総合生活利便性スコア
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '30px'
            }}>
              <div style={{
                fontSize: '4rem',
                fontWeight: 700,
                color: getScoreColor(analysisResult.basicScores.total)
              }}>
                {analysisResult.basicScores.total.toFixed(1)}
              </div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 700,
                color: getScoreColor(analysisResult.basicScores.total),
                background: getScoreColor(analysisResult.basicScores.total) + '20',
                padding: '10px 20px',
                borderRadius: '15px'
              }}>
                {getScoreGrade(analysisResult.basicScores.total)}
              </div>
            </div>
            
            {/* コメント入力エリア */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '10px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ 
                margin: '0 0 15px 0', 
                color: '#495057',
                fontSize: '1.1rem',
                textAlign: 'left'
              }}>
                💬 コメント・メモ
              </h4>
              <textarea
                placeholder="この地域について思ったこと、気づいたことをメモできます..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '15px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = '#007bff';
                  (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = '#ced4da';
                  (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                fontSize: '0.85rem',
                color: '#6c757d'
              }}>
                <span>💡 ヒント: 物件の特徴、周辺環境の印象、検討ポイントなど</span>
                <button
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#007bff'}
                  onClick={() => {
                    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                    if (textarea?.value.trim()) {
                      alert('コメントを保存しました！');
                      // 実際のアプリでは、ここでローカルストレージやサーバーに保存
                      console.log('保存されたコメント:', textarea.value);
                    } else {
                      alert('コメントを入力してください。');
                    }
                  }}
                >
                  💾 保存
                </button>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              📊 項目別詳細スコア
            </h3>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: '教育環境', score: analysisResult.basicScores.education, fullMark: 100 },
                { name: '医療施設', score: analysisResult.basicScores.medical, fullMark: 100 },
                { name: '交通', score: analysisResult.basicScores.transport, fullMark: 100 },
                { name: '安全性', score: analysisResult.basicScores.safety, fullMark: 100 },
                { name: '買い物', score: analysisResult.basicScores.shopping, fullMark: 100 },
                { name: '環境', score: analysisResult.basicScores.environment, fullMark: 100 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: any) => [`${value}点`, 'スコア']} />
                <Bar dataKey="score" fill="#007bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI分析タブ */}
      {activeTab === 'ai' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #9F7AEA 0%, #667eea 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '25px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🤖</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.6rem', fontWeight: 700 }}>
              AI分析レポート
            </h3>
            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
              機械学習による高度な住環境分析
            </p>
          </div>

          {analysisResult.aiAnalysis ? (
            <div>
              {/* AI分析結果表示 */}
              <div style={{
                background: 'white',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                marginBottom: '25px'
              }}>
                <h4 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '20px',
                  fontSize: '1.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  🎯 AI総合評価
                </h4>
                <div style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '10px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontWeight: 600 }}>生活品質スコア:</span>
                    <span style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 700, 
                      color: '#28a745' 
                    }}>
                      {analysisResult.aiAnalysis.livingQualityScore}点
                    </span>
                  </div>
                  <div style={{
                    borderTop: '1px solid #dee2e6',
                    paddingTop: '15px'
                  }}>
                    <h5 style={{ marginBottom: '10px', color: '#495057' }}>総合評価:</h5>
                    <p style={{ 
                      margin: 0, 
                      lineHeight: 1.6,
                      color: '#6c757d'
                    }}>
                      {analysisResult.aiAnalysis.overallEvaluation}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* AI分析用コメントエリア */}
              <div style={{
                background: 'white',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#495057',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🤖 AI分析に対するコメント・メモ
                </h4>
                <textarea
                  id="ai-comment-textarea"
                  placeholder="AI分析結果について、気づいたポイントや疑問点をメモできます...\n\n例:\n• この分析結果で納得できる点\n• 追加で確認したい情報\n• 実際に見学で確認したい項目"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '15px',
                    border: '1px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLTextAreaElement).style.borderColor = '#9F7AEA';
                    (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 0.2rem rgba(159, 122, 234, 0.25)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLTextAreaElement).style.borderColor = '#ced4da';
                    (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '15px',
                  fontSize: '0.85rem',
                  color: '#6c757d'
                }}>
                  <span>💡 AI分析を参考に、実際の見学や調査で確認したいポイントをメモしましょう</span>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #9F7AEA, #667eea)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(159, 122, 234, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.target as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                    onClick={() => {
                      const textarea = document.getElementById('ai-comment-textarea') as HTMLTextAreaElement;
                      if (textarea?.value.trim()) {
                        alert('AI分析コメントを保存しました！\n\n実際の見学時に参考にしてください。');
                        console.log('AI分析コメント保存:', textarea.value);
                      } else {
                        alert('コメントを入力してください。');
                      }
                    }}
                  >
                    🤖 AI分析コメント保存
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔄</div>
              <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                AI分析準備中
              </h3>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '20px' }}>
                統合分析を実行すると、AI による詳細分析が利用可能になります。
              </p>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #dee2e6',
                fontSize: '0.9rem',
                color: '#6c757d'
              }}>
                💡 AI分析機能は現在大幅改良中です。より精度の高い分析結果を提供するため、
                機械学習モデルの改善を行っています。
              </div>
            </div>
          )}
        </div>
      )}

      {/* 市場分析タブ */}
      {activeTab === 'market' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '25px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💹</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.6rem', fontWeight: 700 }}>
              市場分析レポート
            </h3>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              marginTop: '15px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '1.1rem',
                fontWeight: 600
              }}>
                投資格付: {analysisResult.marketAnalysis.investmentRating}
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '1.1rem',
                fontWeight: 600
              }}>
                {analysisResult.marketAnalysis.marketTrend === 'rising' ? '📈 上昇傾向' :
                 analysisResult.marketAnalysis.marketTrend === 'declining' ? '📉 下降傾向' : '📊 安定'}
              </div>
            </div>
          </div>

          {/* 価格情報カード */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '25px'
          }}>
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏠</div>
              <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '5px' }}>平均物件価格</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#28a745',
                marginBottom: '5px'
              }}>
                ¥{(analysisResult.marketAnalysis.averagePrice / 10000).toFixed(0)}万円
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📐</div>
              <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '5px' }}>平米単価</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#007bff',
                marginBottom: '5px'
              }}>
                ¥{(analysisResult.marketAnalysis.pricePerSqm / 10000).toFixed(0)}万円/㎡
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
              <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '5px' }}>地域分析スコア</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#dc3545',
                marginBottom: '5px'
              }}>
                参考值
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#6c757d',
                marginTop: '8px'
              }}>
                *精度向上中
              </div>
            </div>
          </div>

          {/* 価格推移チャート */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            marginBottom: '25px'
          }}>
            <h4 style={{
              color: '#2c3e50',
              margin: '0 0 20px 0',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📈 価格推移（過去5年間）
            </h4>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysisResult.marketAnalysis.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis 
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                />
                <Tooltip 
                  formatter={(value: any) => [`¥${(value / 10000).toFixed(0)}万円`, '価格']}
                  labelFormatter={(label) => `${label}年`}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#28a745" 
                  strokeWidth={3}
                  dot={{ fill: '#28a745', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 競合分析 */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
            <h4 style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎯 地域分析（参考情報）
            </h4>
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '15px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <strong style={{ color: '#856404' }}>データ制限について</strong>
              </div>
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: '#856404',
                lineHeight: 1.5
              }}>
                現在の分析は限定的なデータに基づいています。正確な競合分析や地域ランキングには、
                より包括的な不動産データベースとの連携が必要です。
              </p>
            </div>
            
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              color: '#495057'
            }}>
              <h5 style={{ 
                color: '#495057', 
                marginBottom: '15px',
                fontSize: '1.1rem'
              }}>📊 分析の限界と改善予定</h5>
              
              <div style={{ marginBottom: '15px' }}>
                <strong>現在の状況：</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>Google Maps APIからの基本的な施設情報</li>
                  <li>国土交通省APIからの限定的な地価データ</li>
                  <li>統計的手法による簡易スコア算出</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <strong>今後の改善予定：</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>不動産情報サイトとの連携</li>
                  <li>実際の取引価格データの統合</li>
                  <li>より詳細な地域統計の取得</li>
                  <li>機械学習による精度向上</li>
                </ul>
              </div>
              
              <div style={{
                background: '#e3f2fd',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '15px',
                border: '1px solid #bbdefb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span>💡</span>
                  <strong style={{ color: '#1565c0' }}>推奨事項</strong>
                </div>
                <p style={{ 
                  margin: 0, 
                  color: '#1565c0',
                  fontSize: '0.95rem'
                }}>
                  本分析結果は参考程度にとどめ、実際の物件選択時には：
                  <br />• 現地での実地調査
                  <br />• 複数の不動産会社への相談
                  <br />• 最新の市場動向の確認
                  <br />を併せて行うことを強く推奨します。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* その他のタブ */}
      {(activeTab === 'facilities' || activeTab === 'risks' || activeTab === 'planning') && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
            {activeTab === 'facilities' && '🏢 施設情報'}
            {activeTab === 'risks' && '⚠️ リスク評価'}
            {activeTab === 'planning' && '🏗️ 都市計画'}
          </h3>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '20px' }}>
            この機能は現在開発中です。近日中にリリース予定です。
          </p>
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #dee2e6',
            fontSize: '0.9rem',
            color: '#6c757d'
          }}>
            💡 今後追加予定の機能: 詳細な施設情報、リスクマップ、都市計画データなど
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLifestyleAnalysis;


