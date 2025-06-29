// 統合データ取得サービス
import { GoogleMapsPlacesService } from './GoogleMapsPlacesService';
import { MLITDataService, MLITComprehensiveData } from './MLITDataService';

export class IntegratedDataService {
  // 統合データ取得
  static async fetchComprehensiveAreaData(
    coordinates: { lat: number; lng: number },
    address: string
  ): Promise<IntegratedAreaData> {
    console.log('🔄 統合データサービス: データ取得開始', { coordinates, address });

    try {
      // Google Maps APIと国土交通省APIを並行実行
      const [googleData, mlitData] = await Promise.allSettled([
        GoogleMapsPlacesService.searchComprehensiveFacilities(coordinates),
        MLITDataService.fetchComprehensiveMLITData(coordinates)
      ]);

      console.log('📊 Google Maps API結果:', googleData);
      console.log('🏛️ 国土交通省API結果:', mlitData);

      // データを統合
      const integratedData = this.mergeDataSources(
        googleData.status === 'fulfilled' ? googleData.value : null,
        mlitData.status === 'fulfilled' ? mlitData.value : null,
        coordinates,
        address
      );

      console.log('✅ 統合データ取得完了:', integratedData);
      return integratedData;

    } catch (error) {
      // エラー時は明示的に例外をスロー
      const errorMsg = new Error('データ取得に失敗しました。バックエンドサーバーの状態を確認してください。');
      console.error('❗️ 統合データ取得エラー:', error);
      throw errorMsg;
    }
  }

  // データソースマージ
  private static mergeDataSources(
    googleData: any | null,
    mlitData: MLITComprehensiveData | null,
    coordinates: { lat: number; lng: number },
    address: string
  ): IntegratedAreaData {
    
    // 教育施設の統合
    const education = this.mergeEducationData(googleData?.education, mlitData?.schools || []);
    
    // 医療施設の統合
    const medical = this.mergeMedicalData(googleData?.medical, mlitData?.medical || []);
    
    // 交通機関の統合
    const transport = this.mergeTransportData(googleData?.transport || [], mlitData?.stations || []);
    
    // 商業・レクリエーション施設
    const commercial = googleData?.commercial || [];
    const recreation = googleData?.recreation || [];
    
    // 災害・避難情報
    const disaster = this.processDisasterData(mlitData?.hazards, mlitData?.evacuation || []);
    
    // 地価情報
    const landPrice = mlitData?.landPrice || [];
    
    // 市場分析
    const marketAnalysis = this.generateMarketAnalysis(landPrice, address);

    return {
      timestamp: new Date().toISOString(),
      coordinates,
      address,
      dataSource: {
        googleMaps: !!googleData,
        mlit: !!mlitData
      },
      education,
      medical,
      transport,
      commercial,
      recreation,
      disaster,
      landPrice,
      marketAnalysis,
      statistics: {
        totalFacilities: education.total + medical.total + transport.length + commercial.length + recreation.length,
        dataQuality: this.calculateDataQuality(googleData, mlitData)
      }
    };
  }

  // 教育施設統合
  private static mergeEducationData(googleEdu: any, mlitSchools: any[] = []) {
    const merged = {
      elementary: [] as any[],
      juniorHigh: [] as any[],
      highSchool: [] as any[],
      university: [] as any[],
      kindergarten: [] as any[],
      total: 0
    };

    // Google Mapsデータ
    if (googleEdu) {
      merged.elementary = googleEdu.elementary || [];
      merged.juniorHigh = googleEdu.junior_high || [];
      merged.highSchool = googleEdu.high_school || [];
      merged.university = googleEdu.university || [];
      merged.kindergarten = googleEdu.kindergarten || [];
    }

    // 国土交通省データを追加（重複除去）
    if (mlitSchools && mlitSchools.length > 0) {
      mlitSchools.forEach(school => {
        const facility = {
          id: `mlit_${school.name}`,
          name: school.name,
          type: school.type,
          address: school.address,
          distance: this.calculateDistance(school.coordinates),
          source: 'mlit',
          coordinates: school.coordinates,
          establishedYear: school.establishedYear,
          studentCount: school.studentCount
        };

        // 重複チェック
        const isDuplicate = this.checkDuplicateFacility(facility, [
          ...merged.elementary, ...merged.juniorHigh, ...merged.highSchool, 
          ...merged.university, ...merged.kindergarten
        ]);

        if (!isDuplicate) {
          switch (school.type) {
            case '小学校':
              merged.elementary.push(facility);
              break;
            case '中学校':
              merged.juniorHigh.push(facility);
              break;
            case '高等学校':
            case '高校':
              merged.highSchool.push(facility);
              break;
            case '大学':
              merged.university.push(facility);
              break;
            case '幼稚園':
            case '保育園':
              merged.kindergarten.push(facility);
              break;
          }
        }
      });
    }

    merged.total = merged.elementary.length + merged.juniorHigh.length + 
                   merged.highSchool.length + merged.university.length + merged.kindergarten.length;

    return merged;
  }

  // 医療施設統合
  private static mergeMedicalData(googleMed: any, mlitMedical: any[] = []) {
    const merged = {
      hospitals: [] as any[],
      clinics: [] as any[],
      pharmacies: [] as any[],
      dental: [] as any[],
      total: 0
    };

    // Google Mapsデータ
    if (googleMed) {
      merged.hospitals = googleMed.hospitals || [];
      merged.clinics = googleMed.clinics || [];
      merged.pharmacies = googleMed.pharmacies || [];
      merged.dental = googleMed.dental || [];
    }

    // 国土交通省データを追加
    if (mlitMedical && mlitMedical.length > 0) {
      mlitMedical.forEach(medical => {
        const facility = {
          id: `mlit_${medical.name}`,
          name: medical.name,
          type: medical.type,
          address: medical.address,
          distance: this.calculateDistance(medical.coordinates),
          source: 'mlit',
          coordinates: medical.coordinates,
          departments: medical.departments,
          beds: medical.beds
        };

        const isDuplicate = this.checkDuplicateFacility(facility, [
          ...merged.hospitals, ...merged.clinics, ...merged.pharmacies, ...merged.dental
        ]);

        if (!isDuplicate) {
          switch (medical.type) {
            case '病院':
              merged.hospitals.push(facility);
              break;
            case '歯科':
              merged.dental.push(facility);
              break;
            case '薬局':
              merged.pharmacies.push(facility);
              break;
            default:
              merged.clinics.push(facility);
              break;
          }
        }
      });
    }

    merged.total = merged.hospitals.length + merged.clinics.length + 
                   merged.pharmacies.length + merged.dental.length;

    return merged;
  }

  // 交通機関統合
  private static mergeTransportData(googleTransport: any[] = [], mlitStations: any[] = []) {
    const merged = [...googleTransport];

    if (mlitStations && mlitStations.length > 0) {
      mlitStations.forEach(station => {
        const facility = {
          id: `mlit_${station.name}`,
          name: station.name,
          type: 'station',
          line: station.line,
          company: station.company,
          address: station.address,
          distance: this.calculateDistance(station.coordinates),
          source: 'mlit',
          coordinates: station.coordinates,
          passengerCount: station.passengerCount
        };

        const isDuplicate = this.checkDuplicateFacility(facility, merged);
        if (!isDuplicate) {
          merged.push(facility);
        }
      });
    }

    return merged.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // 災害データ処理
  private static processDisasterData(hazards: any, evacuation: any[] = []) {
    return {
      flood: hazards?.flood || [],
      landslide: hazards?.landslide || [],
      earthquake: hazards?.earthquake || [],
      evacuation: evacuation || [],
      riskLevel: this.calculateRiskLevel(hazards)
    };
  }

  // 市場分析生成
  private static generateMarketAnalysis(landPriceData: any[], address: string) {
    const averageLandPrice = landPriceData.length > 0 
      ? landPriceData.reduce((sum, point) => sum + point.price, 0) / landPriceData.length
      : this.estimateLandPrice(address);

    return {
      averageLandPrice,
      landPricePoints: landPriceData.length,
      trend: this.analyzePriceTrend(landPriceData),
      investmentGrade: this.calculateInvestmentGrade(averageLandPrice, address)
    };
  }

  // ヘルパーメソッド
  private static calculateDistance(coordinates: { lat: number; lng: number }): number {
    // 実際の現在地座標が設定されていないため、仮の座標（渋谷駅）からの距離を計算
    const currentLat = 35.658034;
    const currentLng = 139.701636;
    
    if (!coordinates) return 500; // デフォルト値
    
    const R = 6371e3; // 地球の半径 (メートル)
    const φ1 = currentLat * Math.PI / 180;
    const φ2 = coordinates.lat * Math.PI / 180;
    const Δφ = (coordinates.lat - currentLat) * Math.PI / 180;
    const Δλ = (coordinates.lng - currentLng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  }

  private static checkDuplicateFacility(newFacility: any, existingFacilities: any[]): boolean {
    return existingFacilities.some(existing => 
      existing.name === newFacility.name || 
      this.calculateDistanceBetween(existing.coordinates, newFacility.coordinates) < 50
    );
  }

  private static calculateDistanceBetween(coord1: any, coord2: any): number {
    if (!coord1 || !coord2) return 1000;
    
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

  private static calculateDataQuality(googleData: any, mlitData: any): number {
    let quality = 0;
    if (googleData) quality += 50;
    if (mlitData) quality += 50;
    return quality;
  }

  private static calculateRiskLevel(hazards: any): string {
    if (!hazards) return '情報なし';
    
    const riskCount = (hazards.flood?.length || 0) + 
                     (hazards.landslide?.length || 0) + 
                     (hazards.earthquake?.length || 0);
    
    if (riskCount === 0) return '低リスク';
    if (riskCount <= 2) return '中リスク';
    return '高リスク';
  }

  private static estimateLandPrice(address: string): number {
    // エラー時にはデフォルト値を返すが、ユーザーには明示的にデータが不足していることを伝える
    console.warn('地価情報が取得できないため、デフォルト値を使用: ' + address);
    // 引き続きAPIからの取得を試みる必要があることを示すデフォルト値
    return 0;
  }

  private static analyzePriceTrend(landPriceData: any[]): string {
    // 実際の価格分析に基づく判定
    if (landPriceData.length < 2) {
      console.warn('地価データが不足しているため、トレンド分析できません');
      return 'データ不足';
    }
    
    return '分析中';
  }

  private static calculateInvestmentGrade(price: number, address: string): string {
    if (price === 0) {
      console.warn('地価データが不足しているため、投資格付けは不確定です');
      return 'データ不足';
    }
    
    // 実際の地価データに基づいた格付け
    if (price > 2500000) return 'A';
    if (price > 1500000) return 'B';
    return 'C';
  }


}

// 統合データ型定義
export interface IntegratedAreaData {
  timestamp: string;
  coordinates: { lat: number; lng: number };
  address: string;
  dataSource: {
    googleMaps: boolean;
    mlit: boolean;
  };
  education: {
    elementary: any[];
    juniorHigh: any[];
    highSchool: any[];
    university: any[];
    kindergarten: any[];
    total: number;
  };
  medical: {
    hospitals: any[];
    clinics: any[];
    pharmacies: any[];
    dental: any[];
    total: number;
  };
  transport: any[];
  commercial: any[];
  recreation: any[];
  disaster: {
    flood: any[];
    landslide: any[];
    earthquake: any[];
    evacuation: any[];
    riskLevel: string;
  };
  landPrice: any[];
  marketAnalysis: {
    averageLandPrice: number;
    landPricePoints: number;
    trend: string;
    investmentGrade: string;
  };
  statistics: {
    totalFacilities: number;
    dataQuality: number;
  };
}