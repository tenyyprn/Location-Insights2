// Google Maps Places API統合サービス (バックエンドプロキシ経由)
import axios from 'axios';

// 🔧 環境別API Base URL設定
const getAPIBaseURL = (): string => {
  // 開発環境の判定
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'http://localhost:8002';
  } else {
    // 本番環境では同じオリジンを使用
    return window.location.origin;
  }
};

const API_BASE_URL = getAPIBaseURL();

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NODE_ENV);

interface PlaceSearchResult {
  results: any[];
  status: string;
  next_page_token?: string;
  error?: string;  // エラー情報を追加
}

// 🆕 施設詳細情報の型定義
interface PlaceDetails {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  reviews?: Review[];
  photos?: Photo[];
  types: string[];
  formatted_address?: string;
  geometry?: {
    location: { lat: number; lng: number };
  };
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
}

// 🆕 レビュー情報の型定義
interface Review {
  author_name: string;
  author_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  profile_photo_url?: string;
}

// 🆕 写真情報の型定義
interface Photo {
  height: number;
  width: number;
  photo_reference: string;
}

interface FacilityData {
  [category: string]: {
    type: string;
    count: number;
    places: any[];
    error?: string;
  };
}

export class GoogleMapsPlacesService {
  
  /**
   * バックエンド経由での周辺施設検索
   */
  static async searchNearbyPlaces(
    coordinates: { lat: number; lng: number },
    type: string = 'restaurant',
    radius: number = 1500
  ): Promise<PlaceSearchResult> {
    try {
      console.log(`🗺️ バックエンド経由でGoogle Maps検索: ${type} (半径: ${radius}m)`);
      
      const response = await axios.get(`${API_BASE_URL}/api/google-maps/places/nearby`, {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng, 
          radius,
          place_type: type,
          language: 'ja'
        },
        timeout: 10000
      });
      
      console.log(`✅ Google Maps検索成功: ${type} - ${response.data.results?.length || 0}件`);
      return response.data;
      
    } catch (error: any) {
      console.error(`❌ Google Maps検索エラー (${type}):`, error.message);
      
      // エラーでも空の結果を返す（アプリケーションの継続）
      return {
        results: [],
        status: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * バックエンド経由でのテキスト検索
   */
  static async searchPlacesByText(
    query: string,
    coordinates: { lat: number; lng: number },
    radius: number = 1000
  ): Promise<PlaceSearchResult> {
    try {
      console.log(`🔍 バックエンド経由でGoogle Mapsテキスト検索: ${query}`);
      
      const response = await axios.get(`${API_BASE_URL}/api/google-maps/places/textsearch`, {
        params: {
          query,
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius,
          language: 'ja'
        },
        timeout: 10000
      });
      
      console.log(`✅ テキスト検索成功: ${query} - ${response.data.results?.length || 0}件`);
      return response.data;
      
    } catch (error: any) {
      console.error(`❌ テキスト検索エラー (${query}):`, error.message);
      
      return {
        results: [],
        status: 'ERROR', 
        error: error.message
      };
    }
  }

  /**
   * 🆕 施設の詳細情報を取得（評価、レビュー等）
   */
  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      console.log(`🔍 施設詳細情報取得: ${placeId}`);
      
      const response = await axios.get(`${API_BASE_URL}/api/google-maps/places/details`, {
        params: {
          place_id: placeId,
          language: 'ja',
          fields: 'place_id,name,rating,user_ratings_total,price_level,reviews,photos,types,formatted_address,geometry,opening_hours'
        },
        timeout: 10000
      });
      
      if (response.data.status === 'OK') {
        console.log(`✅ 詳細情報取得成功: ${response.data.result.name}`);
        return response.data.result;
      } else {
        console.warn(`⚠️ 詳細情報取得失敗: ${response.data.status}`);
        return null;
      }
      
    } catch (error: any) {
      console.error(`❌ 詳細情報取得エラー (${placeId}):`, error.message);
      return null;
    }
  }

  /**
   * 🆕 複数施設の詳細情報を一括取得
   */
  static async getBatchPlaceDetails(placeIds: string[]): Promise<(PlaceDetails | null)[]> {
    try {
      console.log(`📦 一括詳細情報取得: ${placeIds.length}件`);
      
      const promises = placeIds.map(placeId => this.getPlaceDetails(placeId));
      const results = await Promise.all(promises);
      
      const validResults = results.filter(result => result !== null);
      console.log(`✅ 一括取得完了: ${validResults.length}/${placeIds.length}件成功`);
      
      return results;
      
    } catch (error: any) {
      console.error('❌ 一括詳細情報取得エラー:', error.message);
      return placeIds.map(() => null);
    }
  }

  /**
   * 包括的な施設情報取得 - 新しいバックエンドエンドポイント使用
   */
  static async searchComprehensiveFacilities(coordinates: { lat: number; lng: number }): Promise<FacilityData> {
    try {
      console.log(`🌟 包括的施設検索開始: (${coordinates.lat}, ${coordinates.lng})`);
      
      const response = await axios.get(`${API_BASE_URL}/api/google-maps/places/comprehensive`, {
        params: { 
          lat: coordinates.lat, 
          lng: coordinates.lng 
        },
        timeout: 30000  // 複数API呼び出しのため長めのタイムアウト
      });
      
      const facilitiesData = response.data.facilities;
      
      console.log(`✅ 包括的施設検索完了:`);
      console.log(`📊 総カテゴリ数: ${response.data.total_categories}`);
      console.log(`🏢 総施設数: ${response.data.total_facilities}`);
      
      // カテゴリ別の結果をログ出力
      Object.entries(facilitiesData).forEach(([category, data]: [string, any]) => {
        const emoji = this.getCategoryEmoji(category);
        console.log(`${emoji} ${category}: ${data.count}件${data.error ? ' (エラー: ' + data.error + ')' : ''}`);
      });
      
      return facilitiesData;
      
    } catch (error: any) {
      console.error('❌ 包括的施設検索エラー:', error.message);
      
      // フォールバック: 空のデータを返す
      return this.createEmptyFacilityData();
    }
  }

  /**
   * カテゴリに応じた絵文字を取得
   */
  private static getCategoryEmoji(category: string): string {
    const emojiMap: { [key: string]: string } = {
      '教育': '🏫',
      '医療': '🏥', 
      '飲食': '🍽️',
      '商業': '🛒',
      '環境': '🌳',
      '薬局': '💊',
      '金融': '🏦',
      '交通': '🚇'
    };
    return emojiMap[category] || '📍';
  }

  /**
   * 空の施設データを作成（エラー時のフォールバック）
   */
  private static createEmptyFacilityData(): FacilityData {
    const categories = ['教育', '医療', '飲食', '商業', '環境', '薬局', '金融', '交通'];
    const emptyData: FacilityData = {};
    
    categories.forEach(category => {
      emptyData[category] = {
        type: 'unknown',
        count: 0,
        places: [],
        error: 'データ取得に失敗しました'
      };
    });
    
    return emptyData;
  }

  /**
   * レガシーメソッド - 既存コードとの互換性のため
   */
  static async getAllFacilities(coordinates: { lat: number; lng: number }) {
    const data = await this.searchComprehensiveFacilities(coordinates);
    
    // 既存の形式に変換
    return {
      education: data['教育']?.places || [],
      medical: data['医療']?.places || [],
      commercial: data['商業']?.places || [],
      transportation: data['交通']?.places || [],
      environment: data['環境']?.places || [],
      safety: []  // 安全施設は別途処理
    };
  }

  /**
   * 教育施設分類（レガシー互換）
   */
  static categorizeEducationFacilities(schools: any[]) {
    const education = {
      elementary: [] as any[],
      junior_high: [] as any[],
      high_school: [] as any[],
      university: [] as any[],
      kindergarten: [] as any[]
    };

    schools.forEach(school => {
      const name = school.name?.toLowerCase() || '';
      
      if (name.includes('小学校') || name.includes('elementary')) {
        education.elementary.push(school);
      } else if (name.includes('中学校') || name.includes('junior')) {
        education.junior_high.push(school);
      } else if (name.includes('高校') || name.includes('高等学校') || name.includes('high school')) {
        education.high_school.push(school);
      } else if (name.includes('大学') || name.includes('university') || name.includes('college')) {
        education.university.push(school);
      } else if (name.includes('幼稚園') || name.includes('保育園') || name.includes('kindergarten')) {
        education.kindergarten.push(school);
      } else {
        education.elementary.push(school);
      }
    });

    return education;
  }

  /**
   * 医療施設分類（レガシー互換）
   */
  static categorizeMedicalFacilities(facilities: any[]) {
    const medical = {
      hospitals: [] as any[],
      clinics: [] as any[],
      pharmacies: [] as any[],
      dental: [] as any[]
    };

    facilities.forEach(facility => {
      const name = facility.name?.toLowerCase() || '';
      const types = facility.types || [];
      
      if (types.includes('pharmacy') || name.includes('薬局') || name.includes('ドラッグ')) {
        medical.pharmacies.push(facility);
      } else if (name.includes('歯科') || name.includes('dental')) {
        medical.dental.push(facility);
      } else if (name.includes('病院') || name.includes('hospital') || types.includes('hospital')) {
        medical.hospitals.push(facility);
      } else {
        medical.clinics.push(facility);
      }
    });

    return medical;
  }

  /**
   * 距離計算（ヘルパー）
   */
  static calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // 地球の半径 (メートル)
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  }

  /**
   * 空のデータ構造（レガシー互換）
   */
  static getEmptyFacilitiesData() {
    return {
      education: {
        elementary: [],
        junior_high: [],
        high_school: [],
        university: [],
        kindergarten: []
      },
      medical: {
        hospitals: [],
        clinics: [],
        pharmacies: [],
        dental: []
      },
      transport: [],
      commercial: [],
      recreation: [],
      finance: []
    };
  }
}

// 型定義
export interface GooglePlace {
  id: string;
  name: string;
  rating?: number;
  address: string;
  distance: number;
  types: string[];
  priceLevel?: number;
  openNow?: boolean;
  photos: Array<{
    reference: string;
    width: number;
    height: number;
  }>;
}

export interface ComprehensiveFacilitiesData {
  education: {
    elementary: GooglePlace[];
    junior_high: GooglePlace[];
    high_school: GooglePlace[];
    university: GooglePlace[];
    kindergarten: GooglePlace[];
  };
  medical: {
    hospitals: GooglePlace[];
    clinics: GooglePlace[];
    pharmacies: GooglePlace[];
    dental: GooglePlace[];
  };
  transport: GooglePlace[];
  commercial: GooglePlace[];
  recreation: GooglePlace[];
  finance: GooglePlace[];
}

// デフォルトエクスポート
export default GoogleMapsPlacesService;