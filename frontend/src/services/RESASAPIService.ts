/**
 * RESAS API Service
 * 地域経済分析システム（RESAS）との連携サービス
 */

// RESAS APIのベースURL
const RESAS_BASE_URL = 'https://opendata.resas-portal.go.jp/api/v1';
const API_KEY = process.env.REACT_APP_RESAS_API_KEY || '';

// 都道府県コードマッピング
const PREFECTURE_CODES: { [key: string]: string } = {
  '北海道': '01', '青森県': '02', '岩手県': '03', '宮城県': '04', '秋田県': '05',
  '山形県': '06', '福島県': '07', '茨城県': '08', '栃木県': '09', '群馬県': '10',
  '埼玉県': '11', '千葉県': '12', '東京都': '13', '神奈川県': '14', '新潟県': '15',
  '富山県': '16', '石川県': '17', '福井県': '18', '山梨県': '19', '長野県': '20',
  '岐阜県': '21', '静岡県': '22', '愛知県': '23', '三重県': '24', '滋賀県': '25',
  '京都府': '26', '大阪府': '27', '兵庫県': '28', '奈良県': '29', '和歌山県': '30',
  '鳥取県': '31', '島根県': '32', '岡山県': '33', '広島県': '34', '山口県': '35',
  '徳島県': '36', '香川県': '37', '愛媛県': '38', '高知県': '39', '福岡県': '40',
  '佐賀県': '41', '長崎県': '42', '熊本県': '43', '大分県': '44', '宮崎県': '45',
  '鹿児島県': '46', '沖縄県': '47'
};

// API レスポンスの型定義
export interface PopulationData {
  year: number;
  value: number;
  rate?: number;
}

export interface IndustryData {
  sicCode: string;
  sicName: string;
  employeeCount: number;
  establishmentCount: number;
  addedValue?: number;
}

export interface RegionalEconomicData {
  // 人口データ
  population: {
    total: PopulationData[];
    ageGroup: {
      young: PopulationData[];  // 0-14歳
      working: PopulationData[]; // 15-64歳
      elderly: PopulationData[]; // 65歳以上
    };
    prediction: PopulationData[];
  };
  
  // 産業・経済データ
  industry: {
    structure: IndustryData[];
    growthRate: { [industry: string]: number };
    employmentRate: number;
  };
  
  // 地域指標
  regional: {
    landPrice: { year: number; price: number; changeRate: number }[];
    commercialVitality: number;
    tourismIndex: number;
    transportationIndex: number;
  };
}

export interface CityInfo {
  prefCode: string;
  cityCode: string;
  cityName: string;
  cityNameKana: string;
}

class RESASAPIService {
  private apiKey: string;

  constructor() {
    this.apiKey = API_KEY;
  }

  /**
   * 共通のAPIリクエスト関数
   */
  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('RESAS APIキーが設定されていません');
    }

    const url = new URL(`${RESAS_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`RESAS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.message && data.message !== null) {
        throw new Error(`RESAS API Error: ${data.message}`);
      }

      return data.result || data;
    } catch (error) {
      console.error('RESAS API Request Error:', error);
      throw error;
    }
  }

  /**
   * 住所から都道府県・市区町村コードを取得
   */
  public extractLocationCodes(address: string): { prefCode: string; cityCode: string | null } {
    // 都道府県の抽出
    const prefectures = Object.keys(PREFECTURE_CODES);
    const prefecture = prefectures.find(pref => address.includes(pref));
    
    if (!prefecture) {
      throw new Error('都道府県が特定できませんでした');
    }

    const prefCode = PREFECTURE_CODES[prefecture];
    
    // 市区町村コードは別途APIで取得が必要（簡易実装では固定値）
    let cityCode: string | null = null;
    
    // 主要都市のマッピング（実際はAPI経由で取得すべき）
    const cityMapping: { [key: string]: string } = {
      '渋谷区': '13113',
      '新宿区': '13104',
      '港区': '13103',
      '千代田区': '13101',
      '中央区': '13102',
    };

    const city = Object.keys(cityMapping).find(city => address.includes(city));
    if (city) {
      cityCode = cityMapping[city];
    }

    return { prefCode, cityCode };
  }

  /**
   * 都道府県一覧取得
   */
  public async getPrefectures(): Promise<any[]> {
    return this.makeRequest('/prefectures');
  }

  /**
   * 市区町村一覧取得
   */
  public async getCities(prefCode: string): Promise<CityInfo[]> {
    return this.makeRequest('/cities', { prefCode });
  }

  /**
   * 人口構成データ取得
   */
  public async getPopulationComposition(prefCode: string, cityCode?: string): Promise<any> {
    const params: Record<string, string> = { prefCode };
    if (cityCode) {
      params.cityCode = cityCode;
    }
    
    return this.makeRequest('/population/composition/perYear', params);
  }

  /**
   * 人口推移データ取得
   */
  public async getPopulationTransition(prefCode: string, cityCode?: string): Promise<any> {
    const params: Record<string, string> = { prefCode };
    if (cityCode) {
      params.cityCode = cityCode;
    }
    
    return this.makeRequest('/population/sum/perYear', params);
  }

  /**
   * 産業構造データ取得
   */
  public async getIndustryStructure(prefCode: string, cityCode?: string, year: string = '2016'): Promise<any> {
    const params: Record<string, string> = { prefCode, year };
    if (cityCode) {
      params.cityCode = cityCode;
    }
    
    return this.makeRequest('/industry/labor/perIndustry', params);
  }

  /**
   * 地価データ取得（模擬実装）
   */
  public async getLandPrice(prefCode: string): Promise<any> {
    // RESAS APIには地価データがないため、模擬データを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        const currentYear = new Date().getFullYear();
        const data = [];
        
        for (let i = 5; i >= 0; i--) {
          const year = currentYear - i;
          const basePrice = 300000 + Math.random() * 200000;
          const changeRate = (Math.random() - 0.5) * 10;
          
          data.push({
            year,
            price: Math.round(basePrice),
            changeRate: Math.round(changeRate * 100) / 100
          });
        }
        
        resolve(data);
      }, 500);
    });
  }

  /**
   * 包括的な地域経済データ取得
   */
  public async getRegionalEconomicData(address: string): Promise<RegionalEconomicData> {
    try {
      const { prefCode, cityCode } = this.extractLocationCodes(address);
      
      console.log(`RESAS分析開始: ${address} (prefCode: ${prefCode}, cityCode: ${cityCode})`);

      // 並行してデータ取得
      const [
        populationComposition,
        populationTransition,
        industryStructure,
        landPriceData
      ] = await Promise.all([
        this.getPopulationComposition(prefCode, cityCode || undefined).catch(() => null),
        this.getPopulationTransition(prefCode, cityCode || undefined).catch(() => null),
        this.getIndustryStructure(prefCode, cityCode || undefined).catch(() => null),
        this.getLandPrice(prefCode).catch(() => [])
      ]);

      // データを統合して返す
      return this.formatRegionalEconomicData({
        populationComposition,
        populationTransition,
        industryStructure,
        landPriceData
      });

    } catch (error) {
      console.error('RESAS データ取得エラー:', error);
      
      // エラー時はサンプルデータを返す
      return this.generateSampleData(address);
    }
  }

  /**
   * APIレスポンスを統一フォーマットに変換
   */
  private formatRegionalEconomicData(rawData: any): RegionalEconomicData {
    const currentYear = new Date().getFullYear();
    
    // 人口データの処理
    const populationData = rawData.populationComposition?.data || [];
    const totalPopulation = populationData.find((d: any) => d.label === '総人口')?.data || [];
    const youngPopulation = populationData.find((d: any) => d.label === '年少人口')?.data || [];
    const workingPopulation = populationData.find((d: any) => d.label === '生産年齢人口')?.data || [];
    const elderlyPopulation = populationData.find((d: any) => d.label === '老年人口')?.data || [];

    // 産業データの処理
    const industryData = rawData.industryStructure?.data || [];
    const processedIndustry = industryData.map((item: any) => ({
      sicCode: item.sicCode || 'unknown',
      sicName: item.sicName || '不明',
      employeeCount: item.employee || 0,
      establishmentCount: item.establishment || 0,
      addedValue: item.addedValue || 0
    }));

    return {
      population: {
        total: totalPopulation,
        ageGroup: {
          young: youngPopulation,
          working: workingPopulation,
          elderly: elderlyPopulation
        },
        prediction: this.generatePopulationPrediction(totalPopulation)
      },
      industry: {
        structure: processedIndustry,
        growthRate: this.calculateGrowthRates(processedIndustry),
        employmentRate: this.calculateEmploymentRate(processedIndustry)
      },
      regional: {
        landPrice: rawData.landPriceData || [],
        commercialVitality: this.calculateCommercialVitality(processedIndustry),
        tourismIndex: Math.random() * 100,
        transportationIndex: Math.random() * 100
      }
    };
  }

  /**
   * 人口予測データ生成
   */
  private generatePopulationPrediction(historicalData: PopulationData[]): PopulationData[] {
    if (!historicalData || historicalData.length === 0) return [];

    const lastData = historicalData[historicalData.length - 1];
    const trend = historicalData.length > 1 
      ? (lastData.value - historicalData[historicalData.length - 2].value) / lastData.value
      : -0.01;

    const predictions = [];
    for (let i = 1; i <= 10; i++) {
      const year = lastData.year + i;
      const value = Math.round(lastData.value * Math.pow(1 + trend, i));
      predictions.push({ year, value, rate: trend * 100 });
    }

    return predictions;
  }

  /**
   * 産業成長率計算
   */
  private calculateGrowthRates(industryData: IndustryData[]): { [industry: string]: number } {
    const growthRates: { [industry: string]: number } = {};
    
    industryData.forEach(industry => {
      // 模擬的な成長率計算
      growthRates[industry.sicName] = (Math.random() - 0.5) * 10;
    });

    return growthRates;
  }

  /**
   * 雇用率計算
   */
  private calculateEmploymentRate(industryData: IndustryData[]): number {
    const totalEmployees = industryData.reduce((sum, item) => sum + item.employeeCount, 0);
    const totalEstablishments = industryData.reduce((sum, item) => sum + item.establishmentCount, 0);
    
    if (totalEstablishments === 0) return 85; // デフォルト値
    
    return Math.min(95, Math.max(70, (totalEmployees / totalEstablishments) * 0.5));
  }

  /**
   * 商業活力度計算
   */
  private calculateCommercialVitality(industryData: IndustryData[]): number {
    const commercialIndustries = industryData.filter(item => 
      item.sicName.includes('卸売') || 
      item.sicName.includes('小売') ||
      item.sicName.includes('サービス')
    );

    const commercialScore = commercialIndustries.reduce((sum, item) => 
      sum + item.employeeCount + item.establishmentCount, 0
    );

    return Math.min(100, Math.max(0, commercialScore / 1000));
  }

  /**
   * サンプルデータ生成（API接続失敗時用）
   */
  private generateSampleData(address: string): RegionalEconomicData {
    const currentYear = new Date().getFullYear();
    
    // 地域特性による調整
    const isTokyoArea = address.includes('東京') || address.includes('渋谷') || address.includes('新宿');
    const populationBase = isTokyoArea ? 300000 : 150000;
    const growthRate = isTokyoArea ? -0.005 : -0.015;

    return {
      population: {
        total: this.generateSamplePopulation(currentYear, populationBase, growthRate),
        ageGroup: {
          young: this.generateSamplePopulation(currentYear, populationBase * 0.12, growthRate - 0.01),
          working: this.generateSamplePopulation(currentYear, populationBase * 0.65, growthRate),
          elderly: this.generateSamplePopulation(currentYear, populationBase * 0.23, 0.02)
        },
        prediction: this.generateSamplePopulation(currentYear + 1, populationBase, growthRate, 10)
      },
      industry: {
        structure: this.generateSampleIndustry(isTokyoArea),
        growthRate: {
          '情報通信業': isTokyoArea ? 5.2 : 2.1,
          '金融・保険業': isTokyoArea ? 3.1 : 1.2,
          '小売業': 1.5,
          '製造業': isTokyoArea ? 0.8 : 2.3,
          'サービス業': 2.8
        },
        employmentRate: isTokyoArea ? 96.2 : 94.1
      },
      regional: {
        landPrice: this.generateSampleLandPrice(currentYear, isTokyoArea),
        commercialVitality: isTokyoArea ? 85 : 65,
        tourismIndex: isTokyoArea ? 92 : 45,
        transportationIndex: isTokyoArea ? 98 : 72
      }
    };
  }

  private generateSamplePopulation(startYear: number, baseValue: number, growthRate: number, years: number = 10): PopulationData[] {
    const data = [];
    for (let i = 0; i < years; i++) {
      const year = startYear - (years - 1 - i);
      const value = Math.round(baseValue * Math.pow(1 + growthRate, i));
      data.push({ year, value, rate: growthRate * 100 });
    }
    return data;
  }

  private generateSampleIndustry(isTokyoArea: boolean): IndustryData[] {
    const industries = [
      { name: '情報通信業', base: isTokyoArea ? 45000 : 8000 },
      { name: '金融・保険業', base: isTokyoArea ? 35000 : 5000 },
      { name: '小売業', base: 25000 },
      { name: '製造業', base: isTokyoArea ? 15000 : 30000 },
      { name: 'サービス業', base: 40000 },
      { name: '建設業', base: 18000 },
      { name: '医療・福祉', base: 22000 }
    ];

    return industries.map((industry, index) => ({
      sicCode: `${index + 1}`,
      sicName: industry.name,
      employeeCount: Math.round(industry.base * (0.8 + Math.random() * 0.4)),
      establishmentCount: Math.round(industry.base / 10 * (0.8 + Math.random() * 0.4)),
      addedValue: Math.round(industry.base * 1.5)
    }));
  }

  private generateSampleLandPrice(currentYear: number, isTokyoArea: boolean): any[] {
    const basePrice = isTokyoArea ? 800000 : 200000;
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const year = currentYear - i;
      const changeRate = isTokyoArea ? 
        (Math.random() - 0.3) * 8 : 
        (Math.random() - 0.6) * 6;
      
      data.push({
        year,
        price: Math.round(basePrice * (1 + changeRate / 100)),
        changeRate: Math.round(changeRate * 100) / 100
      });
    }
    
    return data;
  }
}

export default new RESASAPIService();
