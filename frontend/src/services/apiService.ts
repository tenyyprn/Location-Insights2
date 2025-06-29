import axios from 'axios';

// APIベースURL - 環境に応じて切り替え
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 本番では相対パス（同じドメイン）
  : 'http://localhost:8000'; // 開発では正しいFastAPIサーバーポート（8000に修正）

// Axiosインスタンス作成
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45秒に延長（OpenAI API処理時間を考慮）
  headers: {
    'Content-Type': 'application/json',
  },
});

// デバッグ用ログ
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NODE_ENV);

// 生活利便性スコア関連の型定義
export interface LifestyleAnalysisRequest {
  address: string;
}

// AI分析結果の型定義
export interface AIAnalysisResult {
  detailed_analysis: string;
  lifestyle_recommendations: string[];
  area_characteristics: string;
}

// 🆕 8項目対応の型定義（買い物と飲食を分離）
export interface LifestyleAnalysisResult {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  lifestyle_analysis: {
    lifestyle_scores: {
      total_score: number;
      grade: string;
      breakdown: {
        safety: { score: number; factors: any; details: any };
        transport: { score: number; factors: any; details: any };
        shopping: { score: number; factors: any; details: any };   // 🆕 買い物（分離）
        dining: { score: number; factors: any; details: any };     // 🆕 飲食（分離）
        medical: { score: number; factors: any; details: any };
        education: { score: number; factors: any; details: any };
        environment: { score: number; factors: any; details: any };
        cultural: { score: number; factors: any; details: any };
      };
    };
    recommendations: string[];
    ai_analysis?: AIAnalysisResult; // ← AI分析結果を追加
  };
  summary: {
    total_score: number;
    grade: string;
    strongest_aspect: string;
    areas_for_improvement: string[];
    overall_recommendation: string;
  };
  api_version: string;
  feature: string;
  data_source?: string; // 🆕 データソース識別
}

// API関数
export const apiService = {
  // ヘルスチェック
  async healthCheck() {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error: any) {
      console.error('❌ バックエンドサーバーに接続できません:', error);
      throw new Error('バックエンドサーバーが起動していません。');
    }
  },

  // 生活利便性スコア分析（8項目対応版 - 買い物と飲食を分離）
  async analyzeLifestyleScore(data: LifestyleAnalysisRequest): Promise<LifestyleAnalysisResult> {
    try {
      console.log('🔄 FastAPIサーバーでデータ取得中:', data.address);
      // FastAPIの /api/lifestyle-analysis-8items エンドポイントを使用
      const response = await api.post('/api/lifestyle-analysis-8items', {
        address: data.address
      });
      console.log('✅ APIデータ取得成功:', response.data);
      
      // FastAPIのレスポンス形式を8項目形式に変換
      const apiData = response.data;
      const breakdown = apiData.lifestyle_analysis.lifestyle_scores.breakdown;
      
      // FastAPIの7項目データを8項目に変換（買い物と飲食を分離）
      const facilityDetails = apiData.lifestyle_analysis.facility_details;
      
      const scores = {
        safety: breakdown.safety || 75,
        transport: breakdown.transport || 70,
        shopping: breakdown.shopping || 70, // 既存の買い物スコア
        dining: breakdown.shopping ? breakdown.shopping - 10 : 65,   // 買い物から10点減らして飲食として分離
        medical: breakdown.medical || 75,
        education: breakdown.education || 70,
        environment: breakdown.environment || 70,
        cultural: breakdown.cultural || 65
      };
      
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 8;
      
      // 🔥 10段階グレード計算ロジック
      let grade = 'D'; // デフォルト
      if (totalScore >= 95) {
        grade = 'S+';
      } else if (totalScore >= 90) {
        grade = 'S';
      } else if (totalScore >= 85) {
        grade = 'A+';
      } else if (totalScore >= 80) {
        grade = 'A';
      } else if (totalScore >= 75) {
        grade = 'B+';
      } else if (totalScore >= 70) {
        grade = 'B';
      } else if (totalScore >= 65) {
        grade = 'C+';
      } else if (totalScore >= 60) {
        grade = 'C';
      } else if (totalScore >= 55) {
        grade = 'D+';
      } else {
        grade = 'D';
      }
      
      console.log('🏠 住所:', data.address);
      console.log('📍 座標:', apiData.coordinates);
      console.log('📊 総合スコア:', totalScore.toFixed(1));
      console.log('🏆 グレード:', grade, '(10段階システム)');
      console.log('🔗 データソース: FastAPI v3.1');
      
      // 🆕 施設数のデバッグ情報を追加
      console.log('🏝️ 施設数デバッグ:');
      console.log('　　🏥 教育施設:', facilityDetails?.education?.total_facilities || 0, '件');
      console.log('　　🏥 医療施設:', facilityDetails?.medical?.total_facilities || 0, '件');
      console.log('　　🚇 交通施設:', facilityDetails?.transport?.total_facilities || 0, '件');
      console.log('　　🛍️ 買い物施設:', facilityDetails?.shopping?.total_facilities || 0, '件');
      console.log('　　🍽️ 飲食施設:', facilityDetails?.dining?.total_facilities || 0, '件');
      console.log('　　🛡️ 安全施設:', facilityDetails?.safety?.total_facilities || 0, '件');
      console.log('　　🌳 環境施設:', facilityDetails?.environment?.total_facilities || 0, '件');
      console.log('　　🎭 文化施設:', facilityDetails?.cultural?.total_facilities || 0, '件');
      
      // 詳細データの表示
      console.log('🎓 教育スコア:', scores.education, '点');
      console.log('🏥 医療スコア:', scores.medical, '点');
      console.log('🚇 交通スコア:', scores.transport, '点');
      console.log('🛒 買い物スコア:', scores.shopping, '点');
      console.log('🍽️ 飲食スコア:', scores.dining, '点');
      console.log('🛡️ 安全性スコア:', scores.safety, '点');
      console.log('🌳 環境スコア:', scores.environment, '点');
      console.log('🎭 文化・娯楽スコア:', scores.cultural, '点');
      
      // 8項目対応レスポンス形式に変換
      const convertedResponse: LifestyleAnalysisResult = {
        address: data.address,
        coordinates: {
          lat: apiData.coordinates.lat,
          lng: apiData.coordinates.lng
        },
        lifestyle_analysis: {
          lifestyle_scores: {
            total_score: totalScore,
            grade: grade,
            breakdown: {
              safety: {
                score: scores.safety,
                factors: { 
                  total: facilityDetails?.safety?.total_facilities || 0, 
                  facilities: facilityDetails?.safety?.facilities_list || [] 
                },
                details: facilityDetails?.safety || { note: 'FastAPIの簡易版データ' }
              },
              transport: {
                score: scores.transport,
                factors: { 
                  total: facilityDetails?.transport?.total_facilities || 0, 
                  facilities: facilityDetails?.transport?.facilities_list || [] 
                },
                details: facilityDetails?.transport || { note: 'FastAPIの簡易版データ' }
              },
              shopping: {
                score: scores.shopping,
                factors: { 
                  total: facilityDetails?.shopping?.total_facilities || 0, 
                  facilities: facilityDetails?.shopping?.facilities_list || [] 
                },
                details: facilityDetails?.shopping || { note: 'FastAPIの簡易版データ' }
              },
              dining: {
                score: scores.dining,
                factors: { 
                  total: facilityDetails?.dining?.total_facilities || 0, 
                  facilities: facilityDetails?.dining?.facilities_list || [] 
                },
                details: facilityDetails?.dining || { note: '買い物スコアから分離した推定値' }
              },
              medical: {
                score: scores.medical,
                factors: { 
                  total: facilityDetails?.medical?.total_facilities || 0, 
                  facilities: facilityDetails?.medical?.facilities_list || [] 
                },
                details: facilityDetails?.medical || { note: 'FastAPIの簡易版データ' }
              },
              education: {
                score: scores.education,
                factors: { 
                  total: facilityDetails?.education?.total_facilities || 0, 
                  facilities: facilityDetails?.education?.facilities_list || [] 
                },
                details: facilityDetails?.education || { note: 'FastAPIの簡易版データ' }
              },
              environment: {
                score: scores.environment,
                factors: { 
                  total: facilityDetails?.environment?.total_facilities || 0, 
                  facilities: facilityDetails?.environment?.facilities_list || [] 
                },
                details: facilityDetails?.environment || { note: 'FastAPIの簡易版データ' }
              },
              cultural: {
                score: scores.cultural,
                factors: { 
                  total: facilityDetails?.cultural?.total_facilities || 0, 
                  facilities: facilityDetails?.cultural?.facilities_list || [] 
                },
                details: facilityDetails?.cultural || { note: 'FastAPIの簡易版データ' }
              }
            }
          },
          recommendations: []
        },
        summary: {
          total_score: totalScore,
          grade: grade,
          strongest_aspect: '',
          areas_for_improvement: [],
          overall_recommendation: ''
        },
        api_version: 'FastAPI v3.1',
        feature: '8items_fastapi_converted',
        data_source: 'fastapi_simplified'
      };
      
      return convertedResponse;
    } catch (error: any) {
      console.error('❌ API接続エラー:', error);
      
      // エラー詳細をユーザーに表示
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.detail || error.response.data?.message || '不明なエラー';
        
        if (status === 404) {
          throw new Error('🚧 APIエンドポイントが見つかりません。\n\nバックエンドサーバーの `/api/analyze` エンドポイントを確認してください。');
        } else if (status === 405) {
          throw new Error('🚧 APIメソッドが許可されていません。\n\nバックエンドサーバーでPOSTメソッドを許可する必要があります。');
        } else {
          throw new Error(`🚧 サーバーエラー (${status}): ${message}`);
        }
      } else if (error.request) {
        throw new Error('🔌 FastAPIサーバーに接続できません。\n\nサーバーが起動しているか確認し、ポート5000でアクセス可能かどうか確認してください。\n\n`python main.py` でFastAPIサーバーを起動してください。');
      } else {
        throw new Error(`⚠️ API呼び出しエラー: ${error.message}`);
      }
    }
  },
};

// エラーハンドリング
api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    console.error('API Error:', error);
    
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'サーバーエラーが発生しました';
      throw new Error(message);
    } else if (error.request) {
      throw new Error('サーバーに接続できません。バックエンドが起動しているか確認してください。');
    } else {
      throw new Error('予期しないエラーが発生しました');
    }
  }
);

export default api;