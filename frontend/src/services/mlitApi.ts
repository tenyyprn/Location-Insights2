import axios, { AxiosResponse } from 'axios';
import {
  SchoolData,
  MedicalData,
  StationData,
  RealEstateData,
  LocationAnalysis,
  MLITApiResponse,
  PropertyAnalysisRequest,
  PropertyAnalysisResponse,
  LocationAnalysisResponse,
  ApiError
} from '../types/mlit';

// APIクライアント設定
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://kamui-estate.herokuapp.com/api'
  : 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    const apiError: ApiError = {
      message: error.response?.data?.error || error.message || 'API request failed',
      code: error.response?.status?.toString(),
      details: error.response?.data
    };
    return Promise.reject(apiError);
  }
);

export class MLITApiClient {
  // ヘルスチェック
  static async healthCheck(): Promise<any> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // 学校情報取得
  static async getSchools(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<MLITApiResponse<SchoolData[]>> {
    try {
      const response: AxiosResponse<MLITApiResponse<SchoolData[]>> = await apiClient.get('/mlit/schools', {
        params: { lat, lng, radius }
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // 医療機関情報取得
  static async getMedical(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<MLITApiResponse<MedicalData[]>> {
    try {
      const response: AxiosResponse<MLITApiResponse<MedicalData[]>> = await apiClient.get('/mlit/medical', {
        params: { lat, lng, radius }
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // 駅情報取得
  static async getStations(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<MLITApiResponse<StationData[]>> {
    try {
      const response: AxiosResponse<MLITApiResponse<StationData[]>> = await apiClient.get('/mlit/stations', {
        params: { lat, lng, radius }
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // 不動産価格情報取得
  static async getRealEstate(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<MLITApiResponse<RealEstateData[]>> {
    try {
      const response: AxiosResponse<MLITApiResponse<RealEstateData[]>> = await apiClient.get('/mlit/prices', {
        params: { lat, lng, radius }
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // 総合分析取得
  static async getLocationAnalysis(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<LocationAnalysisResponse> {
    try {
      const response: AxiosResponse<LocationAnalysisResponse> = await apiClient.get('/mlit/analyze', {
        params: { lat, lng, radius }
      });
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // プロパティ分析（POSTエンドポイント）
  static async analyzeProperty(
    request: PropertyAnalysisRequest
  ): Promise<PropertyAnalysisResponse> {
    try {
      const response: AxiosResponse<PropertyAnalysisResponse> = await apiClient.post('/analyze', request);
      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  // 複数API並行取得
  static async getAllData(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<{
    schools: MLITApiResponse<SchoolData[]>;
    medical: MLITApiResponse<MedicalData[]>;
    stations: MLITApiResponse<StationData[]>;
    realEstate: MLITApiResponse<RealEstateData[]>;
  }> {
    try {
      const [schools, medical, stations, realEstate] = await Promise.allSettled([
        this.getSchools(lat, lng, radius),
        this.getMedical(lat, lng, radius),
        this.getStations(lat, lng, radius),
        this.getRealEstate(lat, lng, radius)
      ]);

      return {
        schools: schools.status === 'fulfilled' ? schools.value : { success: false, data: [], error: 'Failed to fetch schools' },
        medical: medical.status === 'fulfilled' ? medical.value : { success: false, data: [], error: 'Failed to fetch medical' },
        stations: stations.status === 'fulfilled' ? stations.value : { success: false, data: [], error: 'Failed to fetch stations' },
        realEstate: realEstate.status === 'fulfilled' ? realEstate.value : { success: false, data: [], error: 'Failed to fetch real estate' }
      };
    } catch (error) {
      throw error as ApiError;
    }
  }
}

// ユーティリティ関数
export const mlitUtils = {
  // 距離計算
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  },

  // 徒歩時間計算（80m/分）
  calculateWalkTime(distance: number): number {
    return Math.round(distance / 80);
  },

  // グレードカラー取得
  getGradeColor(grade: 'S' | 'A' | 'B' | 'C' | 'D'): string {
    const colors = {
      'S': '#9F7AEA', // 紫
      'A': '#48BB78', // 緑
      'B': '#4299E1', // 青
      'C': '#ED8936', // オレンジ
      'D': '#F56565'  // 赤
    };
    return colors[grade];
  },

  // カテゴリアイコン取得
  getCategoryIcon(type: 'school' | 'medical' | 'station' | 'property'): string {
    const icons = {
      school: '🏫',
      medical: '🏥',
      station: '🚉',
      property: '🏠'
    };
    return icons[type];
  },

  // 学校カテゴリ日本語名
  getSchoolCategoryName(category: string): string {
    const names = {
      elementary: '小学校',
      middle: '中学校',
      high: '高等学校',
      university: '大学',
      vocational: '専門学校',
      other: 'その他'
    };
    return names[category as keyof typeof names] || category;
  },

  // 距離の表示形式変換
  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  },

  // 価格の表示形式変換
  formatPrice(price: number): string {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}億円`;
    } else if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万円`;
    } else {
      return `${price.toLocaleString()}円`;
    }
  },

  // データを距離順にソート
  sortByDistance<T extends { distance: number }>(data: T[]): T[] {
    return [...data].sort((a, b) => a.distance - b.distance);
  },

  // グレード順にソート
  sortByGrade<T extends { grade: 'S' | 'A' | 'B' | 'C' | 'D' }>(data: T[]): T[] {
    const gradeOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
    return [...data].sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade]);
  },

  // エラーメッセージの日本語化
  translateError(error: ApiError): string {
    const translations = {
      'Latitude and longitude are required': '緯度・経度の指定が必要です',
      'API request failed': 'APIリクエストに失敗しました',
      'Network Error': 'ネットワークエラーが発生しました',
      'timeout': 'リクエストがタイムアウトしました'
    };
    
    for (const [en, ja] of Object.entries(translations)) {
      if (error.message.includes(en)) {
        return ja;
      }
    }
    
    return error.message;
  }
};

export default MLITApiClient;