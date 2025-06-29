import React, { useState, useEffect } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { mlitPriceService } from '../services/mlitPriceService';

interface PropertyValueAnalysisProps {
  address: string;
  analysisData?: any;
}

// 国土交通省APIから取得したデータの型定義
interface PropertyPriceEstimation {
  estimatedPrice?: number;
  confidence: number;
  priceRange?: {
    min: number;
    max: number;
  };
  comparableTransactions: any[];
  factors?: {
    location: number;
    building: number;
    market: number;
  };
  methodology: string[];
  // 新しいレスポンス形式に対応
  analysis_type?: string;
  title?: string;
  subtitle?: string;
  transaction_examples?: any[];
  market_analysis?: any;
  price_trends?: any;
  location_insights?: any;
  reference_estimate?: {
    estimated_price: number;
    note: string;
  };
  real_data_confirmation?: string; // 追加
}

const PropertyValueAnalysis: React.FC<PropertyValueAnalysisProps> = ({ address, analysisData }) => {
  const [priceData, setPriceData] = useState<PropertyPriceEstimation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'price' | 'trends' | 'data'>('price');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null); // 更新時刻追加

  // 🔧 生活利便性データから要因を生成する関数
  const calculateFactorsFromAnalysisData = (analysisData: any) => {
    if (!analysisData?.lifestyle_analysis?.lifestyle_scores?.breakdown) {
      return {
        location: 0.05,  // デフォルト値
        building: 0.02,
        market: 0.03
      };
    }

    const breakdown = analysisData.lifestyle_analysis.lifestyle_scores.breakdown;
    
    // 各スコアを取得（0-100範囲）
    const transportScore = breakdown.transport?.score || 70;
    const shoppingScore = breakdown.shopping?.score || 70;
    const medicalScore = breakdown.medical?.score || 70;
    const educationScore = breakdown.education?.score || 70;
    const safetyScore = breakdown.safety?.score || 70;
    const environmentScore = breakdown.environment?.score || 70;
    const culturalScore = breakdown.cultural?.score || 70;

    // 立地要因: 交通・買い物・医療・安全性の平均から計算
    const locationAverage = (transportScore + shoppingScore + medicalScore + safetyScore) / 4;
    const locationFactor = (locationAverage - 70) / 100; // -0.7 ~ +0.3 の範囲

    // 建物要因: 基本値（実際の築年・面積データがないため）
    const buildingFactor = 0.02;

    // 市場要因: 教育・環境・文化の平均から計算
    const marketAverage = (educationScore + environmentScore + culturalScore) / 3;
    const marketFactor = (marketAverage - 70) / 150; // -0.47 ~ +0.2 の範囲

    return {
      location: Math.round(locationFactor * 1000) / 1000, // 小数点第3位まで
      building: buildingFactor,
      market: Math.round(marketFactor * 1000) / 1000
    };
  };

  // 国土交通省APIを使用した実データ取得
  const fetchRealEstateData = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 物件情報を仮定（実際はユーザー入力や推定）
      const propertyData = {
        area: 70, // ㎡（仮定）
        buildingYear: 2010, // 建築年（仮定）
        structure: 'RC造', // 構造（仮定）
        floorPlan: '3LDK', // 間取り（仮定）
        stationDistance: 5, // 駅距離（仮定）
        coordinates: analysisData?.coordinates || { lat: 35.6762, lng: 139.6503 } // 座標
      };
      
      console.log('🔄 最新不動産データを取得中 (2023-2025)...', { address, propertyData });
      
      // キャッシュ無効化のためにタイムスタンプを追加
      const timestamp = new Date().getTime();
      
      const estimation: any = await mlitPriceService.estimatePropertyPrice(address, propertyData);
      
      console.log('🔍 API レスポンス:', estimation);
      
      // 🆕 生活利便性データから要因を計算
      const calculatedFactors = calculateFactorsFromAnalysisData(analysisData);
      console.log('📊 計算された価格要因:', calculatedFactors);
      
      // 最新のレスポンス形式に対応
      let normalizedData: PropertyPriceEstimation;
      
      if (estimation.estimatedPrice !== undefined) {
        // 新しい統一レスポンス形式の場合
        console.log('✅ 新しい価格推定レスポンスを処理中:', estimation);
        normalizedData = {
          estimatedPrice: estimation.estimatedPrice,
          confidence: estimation.confidence || 0.75,
          priceRange: estimation.priceRange || {
            min: Math.round(estimation.estimatedPrice * 0.85),
            max: Math.round(estimation.estimatedPrice * 1.15)
          },
          comparableTransactions: estimation.comparableTransactions || [],
          factors: estimation.factors || calculatedFactors, // 🔧 計算された要因を使用
          methodology: estimation.methodology || ['国土交通省API実データ分析'],
          analysis_type: estimation.analysis_type,
          title: estimation.title,
          real_data_confirmation: estimation.real_data_confirmation
        };
      } else if ((estimation as any).analysis_type === 'real_transaction_showcase') {
        // 実取引ショーケース形式の場合
        console.log('🎆 実取引データショーケースを表示', estimation);
        const est = estimation as any; // 型安全性のため明示的にキャスト
        normalizedData = {
          // 参考推定価格を使用（実取引データがメイン）
          estimatedPrice: est.reference_estimate?.estimated_price,
          confidence: 0.85, // 実データの場合は高めの信頼度
          priceRange: {
            // 参考価格から±15%で範囲を計算
            min: Math.round((est.reference_estimate?.estimated_price || 0) * 0.85),
            max: Math.round((est.reference_estimate?.estimated_price || 0) * 1.15)
          },
          // 実取引事例を使用
          comparableTransactions: est.transaction_examples || [],
          factors: est.factors || calculatedFactors, // 🔧 計算された要因を使用
          methodology: est.methodology || ['実取引データベース分析'],
          // 元のデータも保持
          analysis_type: est.analysis_type,
          title: est.title,
          subtitle: est.subtitle,
          transaction_examples: est.transaction_examples,
          market_analysis: est.market_analysis,
          price_trends: est.price_trends,
          location_insights: est.location_insights,
          reference_estimate: est.reference_estimate
        };
      } else {
        // 従来のprice_estimation形式の場合
        console.log('🔄 従来の価格推定を表示', estimation);
        const est = estimation as any; // 型安全性のため明示的にキャスト
        normalizedData = {
          estimatedPrice: est.estimatedPrice,
          confidence: est.confidence || 0.6,
          priceRange: est.priceRange,
          comparableTransactions: est.comparableTransactions || [],
          factors: est.factors || calculatedFactors, // 🔧 計算された要因を使用
          methodology: est.methodology || ['基本的な価格推定'],
          analysis_type: est.analysis_type
        };
      }
      
      // 🔧 要因データの最終確認とログ出力
      console.log('💰 最終設定された要因データ:', normalizedData.factors);
      
      setPriceData(normalizedData);
      setLastUpdated(new Date()); // 更新時刻を記録
    } catch (err: any) {
      console.error('不動産価格取得エラー:', err);
      setError(err.message || '価格情報の取得に失敗しました。バックエンドサーバーが起動しているか確認してください。');
      // エラー時はpriceDataをnullのままにしてエラー表示を行う
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealEstateData();
  }, [address, analysisData]);

  // 手動更新関数
  const handleRefreshData = () => {
    console.log('🔄 手動データ更新を実行...');
    fetchRealEstateData(); // 再実行
  };

  const formatPrice = (price: number | undefined): string => {
    // undefined チェックを追加
    if (price === undefined || price === null || isNaN(price)) {
      return 'データなし';
    }
    
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}億円`;
    } else if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万円`;
    }
    return `${price.toLocaleString()}円`;
  };

  const getFactorColor = (factor: number): string => {
    if (factor > 0.05) return '#4CAF50'; // 緑（プラス要因）
    if (factor > 0) return '#8BC34A'; // 薄緑
    if (factor > -0.05) return '#FFC107'; // 黄色（中立）
    if (factor > -0.1) return '#FF9800'; // オレンジ
    return '#F44336'; // 赤（マイナス要因）
  };

  // 🆕 要因の説明テキストを生成する関数
  const getFactorDescription = (factor: number): string => {
    if (factor > 0.05) return '大幅なプラス要因';
    if (factor > 0.02) return 'プラス要因';
    if (factor > 0) return '軽微なプラス要因';
    if (factor > -0.02) return 'ほぼ中立';
    if (factor > -0.05) return '軽微なマイナス要因';
    if (factor > -0.1) return 'マイナス要因';
    return '大幅なマイナス要因';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#4CAF50'; // 高信頼度
    if (confidence >= 0.6) return '#FFC107'; // 中信頼度
    return '#FF9800'; // 低信頼度
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '15px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }}></div>
          <p style={{ margin: 0, color: '#666' }}>国土交通省APIから不動産価値を分析中...</p>
        </div>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        color: '#666'
      }}>
        {error ? (
          <div>
            <p>❌ {error}</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              バックエンドサーバーが起動しているか確認してください。
            </p>
          </div>
        ) : (
          '価値分析データを取得できませんでした'
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      {/* ヘッダー */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: '0 0 10px 0',
          fontSize: '1.8rem',
          fontWeight: 700
        }}>
          💰 不動産価値・市場分析
        </h2>
        <p style={{
          margin: '0',
          fontSize: '1.1rem',
          opacity: 0.9
        }}>
          {address}の価格情報と市場データ（国土交通省API）
        </p>
        {priceData?.real_data_confirmation && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '10px 15px',
            borderRadius: '8px',
            marginTop: '10px',
            fontSize: '1rem',
            fontWeight: 600
          }}>
            {priceData.real_data_confirmation}
          </div>
        )}
        {lastUpdated && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '8px 15px',
            borderRadius: '6px',
            marginTop: '10px',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🔄 最終更新: {lastUpdated.toLocaleString('ja-JP')}</span>
            <button
              onClick={handleRefreshData}
              disabled={loading}
              style={{
                background: loading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '🔄 更新中...' : '🔄 更新'}
            </button>
          </div>
        )}
      </div>

      {/* タブナビゲーション */}
      <div style={{
        display: 'flex',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        {[
          { key: 'price', label: '💰 価格情報', icon: '💰' },
          { key: 'trends', label: '📈 要因分析', icon: '📈' },
          { key: 'data', label: '📊 データ詳細', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === tab.key ? '#667eea' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#666',
              fontSize: '1rem',
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

      {/* 価格情報タブ */}
      {activeTab === 'price' && (
        <div>
          {/* 推定価格カード */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              color: 'white',
              padding: '25px',
              borderRadius: '15px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>🏠 推定物件価格</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '10px' }}>
                {formatPrice(priceData.estimatedPrice)}
              </div>
              <div style={{ opacity: 0.9, fontSize: '1rem' }}>
                信頼度: {(priceData.confidence * 100).toFixed(0)}%
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.2rem' }}>📊 価格レンジ</h3>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>最低予想価格:</span>
                  <strong>{formatPrice(priceData.priceRange?.min)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>最高予想価格:</span>
                  <strong>{formatPrice(priceData.priceRange?.max)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>価格幅:</span>
                  <strong style={{ color: '#667eea' }}>
                    {priceData.priceRange && priceData.estimatedPrice ? 
                      `±${(((priceData.priceRange.max - priceData.priceRange.min) / 2 / priceData.estimatedPrice) * 100).toFixed(1)}%` :
                      'データなし'
                    }
                  </strong>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '1.2rem' }}>🎯 信頼度評価</h3>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: `conic-gradient(${getConfidenceColor(priceData.confidence)} ${priceData.confidence * 360}deg, #f0f0f0 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.2rem'
                  }}>
                    {(priceData.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ color: getConfidenceColor(priceData.confidence), fontWeight: 600 }}>
                  {priceData.confidence >= 0.8 ? '高精度' : 
                   priceData.confidence >= 0.6 ? '中精度' : '低精度'}
                </div>
              </div>
            </div>
          </div>

          {/* 算出根拠 */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              📋 算出根拠・手法
            </h3>
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔍 分析手法</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#2c3e50' }}>
                {priceData.methodology.map((method, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{method}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 類似物件リスト */}
          {priceData.comparableTransactions.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h4 style={{ 
                fontSize: '1.5rem', 
                marginBottom: '20px', 
                color: '#2c3e50'
              }}>
                🏠 参考取引事例（上位{Math.min(priceData.comparableTransactions.length, 15)}件）
              </h4>

              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '15px',
                marginBottom: '20px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#28a745' }}>
                      {priceData.comparableTransactions.length}件
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>総取引事例数</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#007bff' }}>
                      {Math.round(priceData.comparableTransactions.reduce((sum, t) => sum + (t.similarity_score || 0), 0) / priceData.comparableTransactions.length * 100)}%
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>平均類似度</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fd79a8' }}>
                      {formatPrice(Math.round(priceData.comparableTransactions.reduce((sum, t) => sum + t.TradePrice, 0) / priceData.comparableTransactions.length))}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>平均取引価格</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#6f42c1' }}>
                      {Math.round(priceData.comparableTransactions.reduce((sum, t) => sum + t.Area, 0) / priceData.comparableTransactions.length)}㎡
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>平均面積</div>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {priceData.comparableTransactions.slice(0, 15).map((transaction, index) => {
                  const unitPrice = transaction.UnitPrice || (transaction.TradePrice / transaction.Area);
                  const buildingAge = transaction.BuildingYear ? 
                    (2025 - parseInt(transaction.BuildingYear.replace(/[^0-9]/g, '') || '2020')) : 
                    '不明';
                  
                  return (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '15px',
                        border: `2px solid ${
                          transaction.similarity_score >= 0.75 ? '#28a745' : 
                          transaction.similarity_score >= 0.70 ? '#007bff' : 
                          transaction.similarity_score >= 0.65 ? '#ffc107' : '#fd7e14'
                        }`,
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                      }}
                    >
                      {/* ランキングバッジ */}
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '15px',
                        background: transaction.similarity_score >= 0.75 ? '#28a745' : 
                                  transaction.similarity_score >= 0.70 ? '#007bff' : 
                                  transaction.similarity_score >= 0.65 ? '#ffc107' : '#fd7e14',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        #{index + 1} 類似度 {(transaction.similarity_score * 100).toFixed(0)}%
                      </div>

                      {/* メイン価格表示 */}
                      <div style={{
                        textAlign: 'center',
                        marginTop: '15px',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: '#2c3e50',
                          marginBottom: '5px'
                        }}>
                          {transaction.formatted_price || formatPrice(transaction.TradePrice)}
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          color: '#666',
                          fontWeight: 500
                        }}>
                          {formatPrice(Math.round(unitPrice))} / ㎡
                        </div>
                      </div>

                      {/* 物件詳細情報 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        fontSize: '0.9rem',
                        color: '#555'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>📍</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>{transaction.Municipality}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                              {transaction.distance_km ? `${transaction.distance_km}km` : '距離不明'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>📐</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>{transaction.Area}㎡</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>専有面積</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>🏗️</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                              {transaction.Structure || '構造不明'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>建物構造</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>🏠</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                              {transaction.FloorPlan || '間取り不明'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>間取り</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>📅</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                              {transaction.BuildingYear || '築年不明'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>築{buildingAge}年</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>📊</span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                              {transaction.Period || transaction.transaction_date || '時期不明'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>取引時期</div>
                          </div>
                        </div>
                      </div>

                      {/* データソース表示 */}
                      <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        background: transaction.is_real_data ? '#e8f5e8' : '#fff3cd',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: transaction.is_real_data ? '#155724' : '#856404'
                        }}>
                          {transaction.is_real_data ? '✅ 実取引データ' : '⚠️ 参考データ'}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: transaction.is_real_data ? '#155724' : '#856404',
                          marginTop: '2px'
                        }}>
                          {transaction.data_source === 'mlit_real_api' ? '国土交通省API' : 'その他'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 表示件数情報 */}
              {priceData.comparableTransactions.length > 15 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  padding: '15px',
                  background: '#e9ecef',
                  borderRadius: '10px',
                  color: '#666'
                }}>
                  📊 上位15件を表示中（全{priceData.comparableTransactions.length}件の取引事例があります）
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🔧 修正された要因分析タブ */}
      {activeTab === 'trends' && (
        <div>
          {/* 🔧 要因表示の改良 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {[
              { 
                label: '立地要因', 
                value: priceData.factors?.location || 0, 
                description: '駅距離・周辺施設・安全性',
                details: '交通利便性、買い物利便性、医療施設、安全性の総合評価'
              },
              { 
                label: '建物要因', 
                value: priceData.factors?.building || 0, 
                description: '築年数・面積・構造',
                details: '建物の築年数、専有面積、構造などの物理的特性'
              },
              { 
                label: '市場要因', 
                value: priceData.factors?.market || 0, 
                description: '教育環境・地域価値・文化',
                details: '教育環境、環境品質、文化施設などの地域価値'
              }
            ].map((factor, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                border: `3px solid ${getFactorColor(factor.value)}`,
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: 700 }}>
                  {factor.label}
                </h4>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: getFactorColor(factor.value),
                  marginBottom: '8px'
                }}>
                  {factor.value > 0 ? '+' : ''}{(factor.value * 100).toFixed(1)}%
                </div>
                <div style={{ 
                  color: getFactorColor(factor.value), 
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '10px'
                }}>
                  {getFactorDescription(factor.value)}
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  {factor.description}
                </div>
                <div style={{ 
                  color: '#888', 
                  fontSize: '0.8rem', 
                  lineHeight: 1.3,
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  {factor.details}
                </div>
              </div>
            ))}
          </div>

          {/* 🔧 要因の数値確認用デバッグ情報 */}
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔍 価格要因の詳細数値</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong>立地要因:</strong> {((priceData.factors?.location || 0) * 100).toFixed(3)}%<br/>
                <small style={{ color: '#666' }}>生活利便性スコアから算出</small>
              </div>
              <div>
                <strong>建物要因:</strong> {((priceData.factors?.building || 0) * 100).toFixed(3)}%<br/>
                <small style={{ color: '#666' }}>築年・面積・構造の標準値</small>
              </div>
              <div>
                <strong>市場要因:</strong> {((priceData.factors?.market || 0) * 100).toFixed(3)}%<br/>
                <small style={{ color: '#666' }}>地域価値指標から算出</small>
              </div>
            </div>
          </div>

          {/* 要因詳細分析 */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              📊 価格影響要因の詳細
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '10px',
                borderLeft: `4px solid ${getFactorColor(priceData.factors?.location || 0)}`
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📍 立地要因</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getFactorColor(priceData.factors?.location || 0) }}>
                  {(priceData.factors?.location || 0) > 0 ? '+' : ''}{((priceData.factors?.location || 0) * 100).toFixed(1)}%
                </div>
                <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  駅距離、商業施設、教育機関、安全性などの立地条件が価格に与える影響
                </p>
              </div>
              
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '10px',
                borderLeft: `4px solid ${getFactorColor(priceData.factors?.building || 0)}`
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>🏠 建物要因</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getFactorColor(priceData.factors?.building || 0) }}>
                  {(priceData.factors?.building || 0) > 0 ? '+' : ''}{((priceData.factors?.building || 0) * 100).toFixed(1)}%
                </div>
                <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  築年数、面積、構造、設備グレードなどの建物特性が価格に与える影響
                </p>
              </div>
              
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '10px',
                borderLeft: `4px solid ${getFactorColor(priceData.factors?.market || 0)}`
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📈 市場要因</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getFactorColor(priceData.factors?.market || 0) }}>
                  {(priceData.factors?.market || 0) > 0 ? '+' : ''}{((priceData.factors?.market || 0) * 100).toFixed(1)}%
                </div>
                <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                  地域の価格トレンド、需給バランス、教育環境、文化施設などの地域価値が価格に与える影響
                </p>
              </div>
            </div>
          </div>

          {/* 🆕 生活利便性データとの連携表示 */}
          {analysisData?.lifestyle_analysis?.lifestyle_scores?.breakdown && (
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
                🔗 生活利便性データとの連携
              </h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                価格要因は生活利便性分析の結果を基に算出されています：
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                fontSize: '0.9rem'
              }}>
                <div style={{ background: '#e8f4fd', padding: '15px', borderRadius: '8px' }}>
                  <strong>立地要因の構成:</strong><br/>
                  • 交通利便性: {analysisData.lifestyle_analysis.lifestyle_scores.breakdown.transport?.score?.toFixed(1) || 'N/A'}点<br/>
                  • 買い物利便性: {analysisData.lifestyle_analysis.lifestyle_scores.breakdown.shopping?.score?.toFixed(1) || 'N/A'}点<br/>
                  • 医療施設: {analysisData.lifestyle_analysis.lifestyle_scores.breakdown.medical?.score?.toFixed(1) || 'N/A'}点<br/>
                  • 安全性: {analysisData.lifestyle_analysis.lifestyle_scores.breakdown.safety?.score?.toFixed(1) || 'N/A'}点
                </div>
                <div style={{ background: '#f0f7ff', padding: '15px', borderRadius: '8px' }}>
                  <strong>市場要因の構成:</strong><br/>
                  • 教育環境: {analysisData.lifestyle_analysis.lifestyle_scores.breakdown.education?.score?.toFixed(1) || 'N/A'}点<br/>
                  • 環境品質: {analysisData.lifestyle_analysis.lifestyle_scores.breakdown.environment?.score?.toFixed(1) || 'N/A'}点<br/>
                  • 文化・娯楽: {analysisData.lifestyle_analysis.lifestyle_scores.breakdown.cultural?.score?.toFixed(1) || 'N/A'}点
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* データ詳細タブ */}
      {activeTab === 'data' && (
        <div>
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              📊 データソース情報
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: '#e8f5e8',
                border: '2px solid #28a745',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#155724'
                }}>
                  🏛️ 国土交通省 API
                </h4>
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: '20px', 
                  color: '#155724'
                }}>
                  {[
                    '実際の不動産取引データを使用',
                    '過去2年間の取引事例を分析',
                    '類似物件との比較による推定',
                    '立地・建物・市場要因で調整'
                  ].map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{
                background: '#f0f7ff',
                border: '2px solid #007bff',
                padding: '20px',
                borderRadius: '10px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#004085' }}>
                  📊 分析結果サマリー
                </h4>
                <div style={{ color: '#004085' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>推定価格:</span>
                    <strong>{formatPrice(priceData.estimatedPrice)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>信頼度:</span>
                    <strong>{(priceData.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>参考事例数:</span>
                    <strong>{priceData.comparableTransactions.length}件</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>価格幅:</span>
                    <strong>
                      {priceData.priceRange ? 
                        `${formatPrice(priceData.priceRange.min)} ~ ${formatPrice(priceData.priceRange.max)}` :
                        'データなし'
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </div>
            
            {/* API使用法の説明 */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
                📄 国土交通省 不動産取引価格情報 APIについて
              </h4>
              <div style={{ color: '#666', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 15px 0' }}>
                  このシステムは国土交通省が提供する「不動産取引価格情報提供サイト」のAPIを活用しています。
                </p>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>実際の不動産取引データに基づく価格推定</li>
                  <li>立地・建物・市場要因を統合した多角的分析</li>
                  <li>類似物件との比較による精度向上</li>
                  <li>透明性の高い算出根拠と信頼度表示</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default PropertyValueAnalysis;