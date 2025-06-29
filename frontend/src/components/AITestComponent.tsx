import React, { useState } from 'react';
import { aiAnalysisService, AIAnalysisResult } from '../services/AIAnalysisService';

const AITestComponent: React.FC = () => {
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🤖 AI分析テスト開始');
      
      // テスト用のダミーデータ
      const testData = {
        address: '東京都渋谷区渋谷2-21-1',
        coordinates: { lat: 35.6598, lng: 139.7036 },
        facilities: {
          education: {
            schools: [
              { name: 'テスト小学校', type: '小学校', distance: 300 },
              { name: 'テスト中学校', type: '中学校', distance: 800 }
            ],
            elementarySchools: [],
            kindergartens: []
          },
          medical: {
            medical: [
              { name: 'テストクリニック', type: 'クリニック', distance: 200 }
            ],
            welfare: []
          },
          transport: {
            stations: [
              { name: '渋谷駅', line: 'JR山手線', distance: 500 }
            ],
            libraries: [],
            publicFacilities: []
          },
          commercial: []
        },
        risks: {
          disasterAreas: [],
          liquefaction: [],
          landslide: [],
          steepSlope: []
        },
        market: null,
        planning: {
          zoning: [],
          fireProtection: [],
          districtPlan: []
        }
      };

      // 現在のAIサービスのメソッドを使用
      const lifestyleData = {
        address: testData.address,
        coordinates: testData.coordinates,
        educationCount: 10,
        medicalCount: 5,
        commercialCount: 8,
        transportCount: 3,
        environmentCount: 5,
        safetyCount: 7,
        totalScore: 75,
        scores: {
          education: 80,
          medical: 70,
          transport: 85,
          shopping: 75,
          safety: 65,
          environment: 70,
          cultural: 75,
          dining: 80
        },
        educationDetails: [],
        medicalDetails: [],
        commercialDetails: [],
        transportDetails: [],
        diningDetails: []
      };
      
      const analysisResult = await aiAnalysisService.generateLifestyleAnalysis(lifestyleData);
      console.log('✅ AI分析テスト成功:', analysisResult);
      setResult(analysisResult);

    } catch (error) {
      console.error('❌ AI分析テストエラー:', error);
      setError(error instanceof Error ? error.message : 'AI分析でエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>🤖 AI分析テスト</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          OpenAI APIの動作確認用テスト
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testAIAnalysis}
          disabled={loading}
          style={{
            background: loading 
              ? '#ccc' 
              : 'linear-gradient(135deg, #28a745, #20c997)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? '🔄 AI分析実行中...' : '🚀 AI分析テスト実行'}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>❌ エラー</h4>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>
            ✅ AI分析結果
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                総合スコア
              </h4>
              <div style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#28a745'
              }}>
                {result.livingQualityScore}/100
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                ファミリー適性
              </h4>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: '#6f42c1'
              }}>
                {result.familyFriendliness}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
              総合所見
            </h4>
            <p style={{ 
              margin: 0, 
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '8px',
              lineHeight: 1.6
            }}>
              {result.overallEvaluation}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
                ✅ 強み
              </h4>
              {result.strengthsAnalysis ? result.strengthsAnalysis.split('、').map((strength, index) => (
                <div key={index} style={{
                  padding: '8px',
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '5px',
                  marginBottom: '5px',
                  fontSize: '0.9rem'
                }}>
                  {strength.trim()}
                </div>
              )) : []}
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>
                ⚠️ 弱み
              </h4>
              {result.weaknessesAnalysis ? result.weaknessesAnalysis.split('、').map((weakness, index) => (
                <div key={index} style={{
                  padding: '8px',
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '5px',
                  marginBottom: '5px',
                  fontSize: '0.9rem'
                }}>
                  {weakness.trim()}
                </div>
              )) : []}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
              💡 推奨事項
            </h4>
            {result.recommendations ? result.recommendations.map((recommendation, index) => (
              <div key={index} style={{
                padding: '10px',
                background: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '5px',
                marginBottom: '5px',
                fontSize: '0.9rem'
              }}>
                {recommendation}
              </div>
            )) : []}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>
              👥 適している人
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              {result.suitableFor ? result.suitableFor.map((suitable, index) => (
                <span key={index} style={{
                  padding: '5px 10px',
                  background: '#e8f0fe',
                  border: '1px solid #d2e3fc',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  color: '#1565c0'
                }}>
                  {suitable}
                </span>
              )) : []}
            </div>
          </div>
        </div>
      )}

      {/* デバッグ情報 */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        fontSize: '0.8rem'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🔍 デバッグ情報</h4>
        <div>
          <strong>OpenAI APIキー:</strong> {process.env.REACT_APP_OPENAI_API_KEY ? 
            `設定済み (${process.env.REACT_APP_OPENAI_API_KEY.length}文字)` : 
            '未設定'
          }
        </div>
        <div>
          <strong>環境:</strong> {process.env.NODE_ENV}
        </div>
      </div>
    </div>
  );
};

export default AITestComponent;