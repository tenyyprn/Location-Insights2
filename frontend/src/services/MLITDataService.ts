// 国土交通省 国土数値情報API統合サービス (バックエンドプロキシ経由)
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export class MLITDataService {
  
  // 1. 学校データ取得
  static async fetchSchoolData(coordinates: { lat: number; lng: number }) {
    try {
      console.log('🏫 国土交通省API: 学校データ取得中...');
      
      const response = await axios.get(`${API_BASE_URL}/api/mlit/schools`, {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: 2000
        },
        timeout: 10000
      });

      if (response.data) {
        console.log(`✅ 学校データ取得成功: ${response.data.count}件`);
        return this.formatSchoolData(response.data);
      }
      
      return [];
    } catch (error: any) {
      console.warn('❌ 学校データ取得エラー:', error.message);
      return [];
    }
  }

  // 2. 医療機関データ取得
  static async fetchMedicalData(coordinates: { lat: number; lng: number }) {
    try {
      console.log('🏥 国土交通省API: 医療機関データ取得中...');
      
      const response = await axios.get(`${API_BASE_URL}/api/mlit/medical`, {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: 3000
        },
        timeout: 10000
      });

      if (response.data) {
        console.log(`✅ 医療機関データ取得成功: ${response.data.count}件`);
        return this.formatMedicalData(response.data);
      }
      
      return [];
    } catch (error: any) {
      console.warn('❌ 医療機関データ取得エラー:', error.message);
      return [];
    }
  }

  // 3. 鉄道駅データ取得
  static async fetchStationData(coordinates: { lat: number; lng: number }) {
    try {
      console.log('🚇 国土交通省API: 駅データ取得中...');
      
      const response = await axios.get(`${API_BASE_URL}/api/mlit/stations`, {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: 2000
        },
        timeout: 10000
      });

      if (response.data) {
        console.log(`✅ 駅データ取得成功: ${response.data.count}件`);
        return this.formatStationData(response.data);
      }
      
      return [];
    } catch (error: any) {
      console.warn('❌ 駅データ取得エラー:', error.message);
      return [];
    }
  }

  // 4. 避難場所データ取得
  static async fetchEvacuationData(coordinates: { lat: number; lng: number }) {
    try {
      console.log('🏃 国土交通省API: 避難場所データ取得中...');
      
      const response = await axios.get(`${API_BASE_URL}/api/mlit/evacuation`, {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: 3000
        },
        timeout: 10000
      });

      if (response.data) {
        console.log(`✅ 避難場所データ取得成功: ${response.data.count}件`);
        return this.formatEvacuationData(response.data);
      }
      
      return [];
    } catch (error: any) {
      console.warn('❌ 避難場所データ取得エラー:', error.message);
      return [];
    }
  }

  // 5. ハザードマップデータ取得
  static async fetchHazardMapData(coordinates: { lat: number; lng: number }) {
    try {
      console.log('⚠️ 国土交通省API: ハザードマップデータ取得中...');
      
      const response = await axios.get(`${API_BASE_URL}/api/mlit/disaster-risk`, {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: 1000
        },
        timeout: 10000
      });
      
      if (response.data) {
        console.log(`✅ 災害リスクデータ取得成功: 総合リスク ${response.data.overall_risk}`);
        return {
          flood: response.data.detailed_data?.filter((d: any) => d.type === 'flood') || [],
          landslide: response.data.detailed_data?.filter((d: any) => d.type === 'landslide') || [],
          earthquake: response.data.detailed_data?.filter((d: any) => d.type === 'earthquake') || [],
          overall_risk: response.data.overall_risk,
          flood_risk: response.data.flood_risk,
          earthquake_risk: response.data.earthquake_risk,
          landslide_risk: response.data.landslide_risk
        };
      }
      
      return { flood: [], landslide: [], earthquake: [] };
    } catch (error: any) {
      console.warn('❌ ハザードマップデータ取得エラー:', error.message);
      return { flood: [], landslide: [], earthquake: [] };
    }
  }

  // 6. 地価公示データ取得
  static async fetchLandPriceData(coordinates: { lat: number; lng: number }) {
    try {
      console.log('💰 国土交通省API: 地価公示データ取得中...');
      
      const response = await axios.get(`${API_BASE_URL}/api/mlit/prices`, {
        params: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: 2000
        },
        timeout: 10000
      });

      if (response.data) {
        console.log(`✅ 地価データ取得成功: ${response.data.count}件, 平均価格 ${response.data.average_price}円/㎡`);
        return this.formatLandPriceData(response.data);
      }
      
      return [];
    } catch (error: any) {
      console.warn('❌ 地価公示データ取得エラー:', error.message);
      return [];
    }
  }

  // 統合データ取得
  static async fetchComprehensiveMLITData(coordinates: { lat: number; lng: number }) {
    console.log('🏛️ 国土交通省API: 統合データ取得開始');
    
    try {
      const [
        schoolData,
        medicalData,
        stationData,
        evacuationData,
        hazardData,
        landPriceData
      ] = await Promise.allSettled([
        this.fetchSchoolData(coordinates),
        this.fetchMedicalData(coordinates),
        this.fetchStationData(coordinates),
        this.fetchEvacuationData(coordinates),
        this.fetchHazardMapData(coordinates),
        this.fetchLandPriceData(coordinates)
      ]);

      const result = {
        schools: schoolData.status === 'fulfilled' ? schoolData.value : [],
        medical: medicalData.status === 'fulfilled' ? medicalData.value : [],
        stations: stationData.status === 'fulfilled' ? stationData.value : [],
        evacuation: evacuationData.status === 'fulfilled' ? evacuationData.value : [],
        hazards: hazardData.status === 'fulfilled' ? hazardData.value : { flood: [], landslide: [], earthquake: [] },
        landPrice: landPriceData.status === 'fulfilled' ? landPriceData.value : []
      };

      console.log('✅ 国土交通省API: データ取得完了', result);
      return result;
    } catch (error: any) {
      console.error('❌ 国土交通省API統合取得エラー:', error.message);
      // エラーでも空のデータ構造を返す
      return {
        schools: [],
        medical: [],
        stations: [],
        evacuation: [],
        hazards: { flood: [], landslide: [], earthquake: [] },
        landPrice: []
      };
    }
  }

  // プライベートメソッド - データ整形

  private static formatSchoolData(data: any) {
    if (!data?.schools) return [];
    
    return data.schools.map((school: any) => ({
      name: school.name || '学校',
      type: school.type || '学校',
      address: school.address || '',
      coordinates: {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0
      },
      distance: school.distance || 0,
      establishedYear: school.establishedYear,
      studentCount: school.studentCount
    }));
  }

  private static formatMedicalData(data: any) {
    if (!data?.medical_facilities) return [];
    
    return data.medical_facilities.map((facility: any) => ({
      name: facility.name || '医療機関',
      type: facility.type || '医療機関',
      address: facility.address || '',
      coordinates: {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0
      },
      distance: facility.distance || 0,
      departments: facility.departments || [],
      beds: facility.beds
    }));
  }

  private static formatStationData(data: any) {
    if (!data?.stations) return [];
    
    return data.stations.map((station: any) => ({
      name: station.name || '駅',
      line: station.line || '路線',
      company: station.company || station.type || '鉄道会社',
      address: station.address || '',
      coordinates: {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0
      },
      distance: station.distance || 0,
      passengerCount: station.passengerCount
    }));
  }

  private static formatEvacuationData(data: any) {
    if (!data?.evacuation_sites) return [];
    
    return data.evacuation_sites.map((site: any) => ({
      name: site.name || '避難場所',
      type: site.type || '避難場所',
      address: site.address || '',
      coordinates: {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0
      },
      distance: site.distance || 0,
      capacity: site.capacity,
      facilities: site.facilities || []
    }));
  }

  private static formatLandPriceData(data: any) {
    if (!data?.detailed_data) return [];
    
    return data.detailed_data.map((priceData: any) => ({
      pointNumber: priceData.point_number || '',
      price: priceData.price || 0,
      year: priceData.year || 2024,
      landUse: priceData.location || priceData.land_use || '',
      address: priceData.address || '',
      coordinates: {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0
      },
      changeRate: priceData.change_rate || 0,
      area: priceData.area,
      frontage: priceData.frontage
    }));
  }

  // ヘルパーメソッド
  private static getSchoolType(properties: any): string {
    const name = properties?.name || properties?.N03_007 || '';
    if (name.includes('小学校')) return '小学校';
    if (name.includes('中学校')) return '中学校';
    if (name.includes('高等学校') || name.includes('高校')) return '高等学校';
    if (name.includes('大学')) return '大学';
    if (name.includes('幼稚園')) return '幼稚園';
    if (name.includes('保育園')) return '保育園';
    return '学校';
  }

  private static getMedicalType(properties: any): string {
    const name = properties?.name || '';
    if (name.includes('病院')) return '病院';
    if (name.includes('クリニック')) return 'クリニック';
    if (name.includes('歯科')) return '歯科';
    if (name.includes('薬局')) return '薬局';
    return '医療機関';
  }
}

// 型定義
export interface MLITSchool {
  name: string;
  type: string;
  address: string;
  coordinates: { lat: number; lng: number };
  distance: number;
  establishedYear?: number;
  studentCount?: number;
}

export interface MLITMedical {
  name: string;
  type: string;
  address: string;
  coordinates: { lat: number; lng: number };
  distance: number;
  departments: string[];
  beds?: number;
}

export interface MLITStation {
  name: string;
  line: string;
  company: string;
  address: string;
  coordinates: { lat: number; lng: number };
  distance: number;
  passengerCount?: number;
}

export interface MLITEvacuation {
  name: string;
  type: string;
  address: string;
  coordinates: { lat: number; lng: number };
  distance: number;
  capacity?: number;
  facilities: string[];
}

export interface MLITLandPrice {
  pointNumber: string;
  price: number;
  year: number;
  landUse: string;
  address: string;
  coordinates: { lat: number; lng: number };
  changeRate: number;
  area?: number;
  frontage?: number;
}

export interface MLITComprehensiveData {
  schools: MLITSchool[];
  medical: MLITMedical[];
  stations: MLITStation[];
  evacuation: MLITEvacuation[];
  hazards: {
    flood: any[];
    landslide: any[];
    earthquake: any[];
    overall_risk?: string;
    flood_risk?: string;
    earthquake_risk?: string;
    landslide_risk?: string;
  };
  landPrice: MLITLandPrice[];
}

// デフォルトエクスポート
export default MLITDataService;