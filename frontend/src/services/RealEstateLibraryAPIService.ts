// 不動産情報ライブラリAPI統合サービス
export class RealEstateLibraryAPIService {
  private static readonly BASE_URL = process.env.NODE_ENV === 'development' 
    ? '/api/reinfolib'
    : 'https://www.reinfolib.mlit.go.jp/ex-api';
  private static readonly API_KEY = process.env.REACT_APP_REAL_ESTATE_LIB_API_KEY;

  // 1. 不動産価格（取引価格・成約価格）情報取得
  static async fetchTransactionPrices(params: {
    from: string;  // YYYY年QQ四半期形式
    to: string;
    city?: string; // 市区町村コード
    area?: string; // 地域コード
  }) {
    try {
      const endpoint = `${this.BASE_URL}/RealEstateTradingPrice`;
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.append('from', params.from);
      url.searchParams.append('to', params.to);
      if (params.city) url.searchParams.append('city', params.city);
      if (params.area) url.searchParams.append('area', params.area);
      
      const response = await this.makeRequest(url.toString());
      return this.parseTransactionData(response);
    } catch (error) {
      console.error('不動産取引価格情報の取得に失敗:', error);
      return null;
    }
  }

  // 2. 都道府県内市区町村一覧取得
  static async fetchCitiesInPrefecture(prefectureCode: string) {
    try {
      const url = this.buildURL(`cities/${prefectureCode}`);
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('市区町村一覧の取得に失敗:', error);
      return [];
    }
  }

  // 3. 鑑定評価書情報API
  static async fetchAppraisalInfo(params: {
    year: number;
    prefectureCode?: string;
    cityCode?: string;
  }) {
    try {
      const queryParams: Record<string, string> = {
        year: params.year.toString()
      };
      if (params.prefectureCode) queryParams.area = params.prefectureCode;
      if (params.cityCode) queryParams.city = params.cityCode;
      
      const url = this.buildURL('RealEstateAppraisal', queryParams);
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('鑑定評価書情報の取得に失敗:', error);
      return [];
    }
  }

  // 4. 地価公示・地価調査のポイント（点）API
  static async fetchLandPricePoints(params: {
    year: number;
    coordinates: { lat: number; lng: number };
    radius?: number; // メートル
  }) {
    try {
      const queryParams: Record<string, string> = {
        year: params.year.toString(),
        latitude: params.coordinates.lat.toString(),
        longitude: params.coordinates.lng.toString()
      };
      if (params.radius) queryParams.radius = params.radius.toString();
      
      const url = this.buildURL('LandPrice', queryParams);
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('地価公示情報の取得に失敗:', error);
      return [];
    }
  }

  // 5. 教育施設情報の統合取得
  static async fetchEducationFacilities(coordinates: { lat: number; lng: number }, radius: number = 1000) {
    try {
      const [schools, elementarySchools, kindergartens] = await Promise.all([
        this.fetchSchools(coordinates, radius),
        this.fetchElementarySchoolDistricts(coordinates),
        this.fetchKindergartens(coordinates, radius)
      ]);

      return {
        schools: schools || [],
        elementarySchools: elementarySchools || [],
        kindergartens: kindergartens || []
      };
    } catch (error) {
      console.error('教育施設情報の取得に失敗:', error);
      return { schools: [], elementarySchools: [], kindergartens: [] };
    }
  }

  // 6. 国土数値情報（学校）API
  static async fetchSchools(coordinates: { lat: number; lng: number }, radius: number) {
    try {
      const queryParams = {
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString(),
        radius: radius.toString()
      };
      
      const url = this.buildURL('School', queryParams);
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('学校情報の取得に失敗:', error);
      return [];
    }
  }

  // 7. 国土数値情報（小学校区）API
  static async fetchElementarySchoolDistricts(coordinates: { lat: number; lng: number }) {
    try {
      const queryParams = {
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString()
      };
      
      const url = this.buildURL('ElementarySchoolDistrict', queryParams);
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('小学校区情報の取得に失敗:', error);
      return [];
    }
  }

  // 8. 国土数値情報（保育園・幼稚園等）API
  static async fetchKindergartens(coordinates: { lat: number; lng: number }, radius: number) {
    try {
      const queryParams = {
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString(),
        radius: radius.toString()
      };
      
      const url = this.buildURL('Kindergarten', queryParams);
      const response = await this.makeRequest(url);
      return response.data || [];
    } catch (error) {
      console.error('保育園・幼稚園情報の取得に失敗:', error);
      return [];
    }
  }

  // 9. 医療・福祉施設情報の統合取得
  static async fetchMedicalFacilities(coordinates: { lat: number; lng: number }, radius: number = 1000) {
    try {
      const [medical, welfare] = await Promise.all([
        this.fetchMedicalInstitutions(coordinates, radius),
        this.fetchWelfareFacilities(coordinates, radius)
      ]);

      return {
        medical: medical || [],
        welfare: welfare || []
      };
    } catch (error) {
      console.error('医療・福祉施設情報の取得に失敗:', error);
      return { medical: [], welfare: [] };
    }
  }

  // 10. 国土数値情報（医療機関）API
  static async fetchMedicalInstitutions(coordinates: { lat: number; lng: number }, radius: number) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/MedicalInstitution`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      url.searchParams.append('radius', radius.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('医療機関情報の取得に失敗:', error);
      return [];
    }
  }

  // 11. 国土数値情報（福祉施設）API
  static async fetchWelfareFacilities(coordinates: { lat: number; lng: number }, radius: number) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/WelfareFacility`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      url.searchParams.append('radius', radius.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('福祉施設情報の取得に失敗:', error);
      return [];
    }
  }

  // 12. 災害リスク情報の統合取得
  static async fetchDisasterRiskInfo(coordinates: { lat: number; lng: number }) {
    try {
      const [disasterAreas, liquefaction, landslide, steepSlope] = await Promise.all([
        this.fetchDisasterRiskAreas(coordinates),
        this.fetchLiquefactionRisk(coordinates),
        this.fetchLandslidePreventionAreas(coordinates),
        this.fetchSteepSlopeRiskAreas(coordinates)
      ]);

      return {
        disasterAreas: disasterAreas || [],
        liquefaction: liquefaction || [],
        landslide: landslide || [],
        steepSlope: steepSlope || []
      };
    } catch (error) {
      console.error('災害リスク情報の取得に失敗:', error);
      return { disasterAreas: [], liquefaction: [], landslide: [], steepSlope: [] };
    }
  }

  // 13. 国土数値情報（災害危険区域）API
  static async fetchDisasterRiskAreas(coordinates: { lat: number; lng: number }) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/DisasterRiskArea`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('災害危険区域情報の取得に失敗:', error);
      return [];
    }
  }

  // 14. 液状化リスク情報API
  static async fetchLiquefactionRisk(coordinates: { lat: number; lng: number }) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/LiquefactionRisk`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('液状化リスク情報の取得に失敗:', error);
      return [];
    }
  }

  // 15. 地すべり防止地区API
  static async fetchLandslidePreventionAreas(coordinates: { lat: number; lng: number }) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/LandslidePreventionArea`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('地すべり防止地区情報の取得に失敗:', error);
      return [];
    }
  }

  // 16. 急傾斜地崩壊危険区域API
  static async fetchSteepSlopeRiskAreas(coordinates: { lat: number; lng: number }) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/SteepSlopeRiskArea`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('急傾斜地崩壊危険区域情報の取得に失敗:', error);
      return [];
    }
  }

  // 17. 都市計画情報の統合取得
  static async fetchUrbanPlanningInfo(coordinates: { lat: number; lng: number }) {
    try {
      const [zoning, fireProtection, districtPlan] = await Promise.all([
        this.fetchZoningInfo(coordinates),
        this.fetchFireProtectionAreas(coordinates),
        this.fetchDistrictPlan(coordinates)
      ]);

      return {
        zoning: zoning || [],
        fireProtection: fireProtection || [],
        districtPlan: districtPlan || []
      };
    } catch (error) {
      console.error('都市計画情報の取得に失敗:', error);
      return { zoning: [], fireProtection: [], districtPlan: [] };
    }
  }

  // 18. 都市計画決定GISデータ（用途地域）API
  static async fetchZoningInfo(coordinates: { lat: number; lng: number }) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/Zoning`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('用途地域情報の取得に失敗:', error);
      return [];
    }
  }

  // 19. 都市計画決定GISデータ（防火・準防火地域）API
  static async fetchFireProtectionAreas(coordinates: { lat: number; lng: number }) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/FireProtectionArea`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('防火・準防火地域情報の取得に失敗:', error);
      return [];
    }
  }

  // 20. 都市計画決定GISデータ（地区計画）API
  static async fetchDistrictPlan(coordinates: { lat: number; lng: number }) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/DistrictPlan`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('地区計画情報の取得に失敗:', error);
      return [];
    }
  }

  // 21. 交通・利便施設情報の統合取得
  static async fetchTransportAndFacilities(coordinates: { lat: number; lng: number }, radius: number = 1000) {
    try {
      const [stations, libraries, publicFacilities] = await Promise.all([
        this.fetchStationInfo(coordinates, radius),
        this.fetchLibraries(coordinates, radius),
        this.fetchPublicFacilities(coordinates, radius)
      ]);

      return {
        stations: stations || [],
        libraries: libraries || [],
        publicFacilities: publicFacilities || []
      };
    } catch (error) {
      console.error('交通・利便施設情報の取得に失敗:', error);
      return { stations: [], libraries: [], publicFacilities: [] };
    }
  }

  // 22. 国土数値情報（駅別乗降客数）API
  static async fetchStationInfo(coordinates: { lat: number; lng: number }, radius: number) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/Station`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      url.searchParams.append('radius', radius.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('駅情報の取得に失敗:', error);
      return [];
    }
  }

  // 23. 国土数値情報（図書館）API
  static async fetchLibraries(coordinates: { lat: number; lng: number }, radius: number) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/Library`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      url.searchParams.append('radius', radius.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('図書館情報の取得に失敗:', error);
      return [];
    }
  }

  // 24. 国土数値情報（市区町村役場及び集会施設等）API
  static async fetchPublicFacilities(coordinates: { lat: number; lng: number }, radius: number) {
    try {
      const url = new URL(`${this.BASE_URL}/v1/PublicFacility`);
      url.searchParams.append('latitude', coordinates.lat.toString());
      url.searchParams.append('longitude', coordinates.lng.toString());
      url.searchParams.append('radius', radius.toString());
      
      const response = await this.makeRequest(url.toString());
      return response.data || [];
    } catch (error) {
      console.error('公共施設情報の取得に失敗:', error);
      return [];
    }
  }

  // 25. 包括的地域分析データ取得
  static async fetchComprehensiveAreaAnalysis(coordinates: { lat: number; lng: number }, address: string) {
    try {
      console.log(`🏢 不動産情報ライブラリAPI: 包括的地域分析開始 ${address}`);
      
      const [
        transactionPrices,
        landPrices,
        educationFacilities,
        medicalFacilities,
        disasterRisk,
        urbanPlanning,
        transport
      ] = await Promise.allSettled([
        this.fetchTransactionPrices({ 
          from: '2023年1Q', 
          to: '2024年4Q',
          area: this.getAreaCodeFromAddress(address)
        }),
        this.fetchLandPricePoints({ year: 2024, coordinates }),
        this.fetchEducationFacilities(coordinates),
        this.fetchMedicalFacilities(coordinates),
        this.fetchDisasterRiskInfo(coordinates),
        this.fetchUrbanPlanningInfo(coordinates),
        this.fetchTransportAndFacilities(coordinates)
      ]);

      return {
        transactionPrices: transactionPrices.status === 'fulfilled' ? transactionPrices.value : null,
        landPrices: landPrices.status === 'fulfilled' ? landPrices.value : [],
        education: educationFacilities.status === 'fulfilled' ? educationFacilities.value : { schools: [], elementarySchools: [], kindergartens: [] },
        medical: medicalFacilities.status === 'fulfilled' ? medicalFacilities.value : { medical: [], welfare: [] },
        disaster: disasterRisk.status === 'fulfilled' ? disasterRisk.value : { disasterAreas: [], liquefaction: [], landslide: [], steepSlope: [] },
        urbanPlanning: urbanPlanning.status === 'fulfilled' ? urbanPlanning.value : { zoning: [], fireProtection: [], districtPlan: [] },
        transport: transport.status === 'fulfilled' ? transport.value : { stations: [], libraries: [], publicFacilities: [] }
      };
    } catch (error) {
      console.error('包括的地域分析データの取得に失敗:', error);
      throw error;
    }
  }

  // ユーティリティメソッド

  // 安全なURL構築
  private static buildURL(endpoint: string, params?: Record<string, string>): string {
    const fullEndpoint = `${this.BASE_URL}/${endpoint}`;
    let url: URL;
    
    if (this.BASE_URL.startsWith('/')) {
      // 相対パスの場合（プロキシ経由）
      url = new URL(fullEndpoint, window.location.origin);
    } else {
      // 絶対パスの場合（直接APIアクセス）
      url = new URL(fullEndpoint);
    }
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }
    
    return url.toString();
  }

  // APIリクエスト実行
  private static async makeRequest(url: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.API_KEY) {
      headers['X-API-Key'] = this.API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // 住所から地域コードを推定
  private static getAreaCodeFromAddress(address: string): string {
    const prefectureToCode: { [key: string]: string } = {
      '東京都': '13',
      '大阪府': '27',
      '愛知県': '23',
      '神奈川県': '14',
      '京都府': '26',
      '兵庫県': '28',
      '埼玉県': '11',
      '千葉県': '12'
    };

    for (const [pref, code] of Object.entries(prefectureToCode)) {
      if (address.includes(pref)) {
        return code;
      }
    }
    
    return '13'; // デフォルト: 東京都
  }

  // 取引データのパース
  private static parseTransactionData(data: any) {
    if (!data || !data.data) return null;

    return {
      averagePrice: data.data.reduce((sum: number, item: any) => sum + (item.price || 0), 0) / data.data.length,
      medianPrice: this.calculateMedian(data.data.map((item: any) => item.price || 0)),
      priceRange: {
        min: Math.min(...data.data.map((item: any) => item.price || 0)),
        max: Math.max(...data.data.map((item: any) => item.price || 0))
      },
      transactionCount: data.data.length,
      pricePerSqm: data.data
        .filter((item: any) => item.area && item.price)
        .map((item: any) => item.price / item.area),
      trends: this.calculatePriceTrends(data.data)
    };
  }

  // 中央値計算
  private static calculateMedian(values: number[]): number {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  // 価格トレンド計算
  private static calculatePriceTrends(data: any[]): any[] {
    // 四半期別の価格推移を計算
    const quarterlyData: { [key: string]: number[] } = {};
    
    data.forEach(item => {
      const quarter = item.quarter || '2024年1Q';
      if (!quarterlyData[quarter]) {
        quarterlyData[quarter] = [];
      }
      quarterlyData[quarter].push(item.price || 0);
    });

    return Object.entries(quarterlyData).map(([quarter, prices]) => ({
      quarter,
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      transactionCount: prices.length
    }));
  }
}

// APIレスポンスの型定義
export interface RealEstateTransaction {
  price: number;
  area: number;
  pricePerSqm: number;
  quarter: string;
  location: string;
  buildingType: string;
}

export interface LandPricePoint {
  year: number;
  price: number;
  coordinates: { lat: number; lng: number };
  address: string;
  landUse: string;
}

export interface ComprehensiveAreaData {
  transactionPrices: any;
  landPrices: LandPricePoint[];
  education: {
    schools: any[];
    elementarySchools: any[];
    kindergartens: any[];
  };
  medical: {
    medical: any[];
    welfare: any[];
  };
  disaster: {
    disasterAreas: any[];
    liquefaction: any[];
    landslide: any[];
    steepSlope: any[];
  };
  urbanPlanning: {
    zoning: any[];
    fireProtection: any[];
    districtPlan: any[];
  };
  transport: {
    stations: any[];
    libraries: any[];
    publicFacilities: any[];
  };
}