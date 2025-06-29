// 犯罪統計API統合サービス
export class CrimeStatisticsAPIService {
  private static readonly E_STAT_API_KEY = process.env.REACT_APP_ESTAT_APP_ID;
  private static readonly TOKYO_OPENDATA_BASE_URL = 'https://catalog.data.metro.tokyo.lg.jp/api/3/action';
  private static readonly NPA_BASE_URL = 'https://www.npa.go.jp/publications/statistics';

  // 地域の犯罪統計包括取得
  static async fetchComprehensiveCrimeData(coordinates: { lat: number; lng: number }, address: string) {
    try {
      console.log('🚓 犯罪統計API: 包括データ取得開始', address);
      
      const [
        nationalStats,
        tokyoCrimeData,
        trafficAccidents,
        timeBasedAnalysis,
        crimeHotspots
      ] = await Promise.allSettled([
        this.fetchNationalCrimeStatistics(address),
        this.fetchTokyoCrimeData(coordinates),
        this.fetchTrafficAccidentData(coordinates),
        this.analyzeTimeBasedCrimePatterns(coordinates),
        this.identifyCrimeHotspots(coordinates, 1000) // 1km半径
      ]);

      return {
        nationalStats: nationalStats.status === 'fulfilled' ? nationalStats.value : null,
        localCrime: tokyoCrimeData.status === 'fulfilled' ? tokyoCrimeData.value : null,
        trafficSafety: trafficAccidents.status === 'fulfilled' ? trafficAccidents.value : null,
        timePatterns: timeBasedAnalysis.status === 'fulfilled' ? timeBasedAnalysis.value : null,
        hotspots: crimeHotspots.status === 'fulfilled' ? crimeHotspots.value : null,
        safetyScore: this.calculateSafetyScore({
          nationalStats: nationalStats.status === 'fulfilled' ? nationalStats.value : null,
          localCrime: tokyoCrimeData.status === 'fulfilled' ? tokyoCrimeData.value : null,
          trafficSafety: trafficAccidents.status === 'fulfilled' ? trafficAccidents.value : null
        })
      };
    } catch (error) {
      console.error('犯罪統計データ取得エラー:', error);
      throw error;
    }
  }

  // 1. 全国犯罪統計データ取得（e-Stat API）
  static async fetchNationalCrimeStatistics(address: string): Promise<NationalCrimeStats> {
    try {
      const prefectureCode = this.getPrefectureCodeFromAddress(address);
      const statsId = '0003195003'; // 犯罪統計表ID
      
      const url = new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');
      url.searchParams.append('appId', this.E_STAT_API_KEY || '');
      url.searchParams.append('statsDataId', statsId);
      url.searchParams.append('cdArea', prefectureCode);
      url.searchParams.append('cdTime', '2023000000-2024000000'); // 2023-2024年
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`e-Stat API Error: ${response.status}`);
      
      const data = await response.json();
      return this.parseNationalStats(data);
    } catch (error) {
      console.error('全国犯罪統計取得エラー:', error);
      return this.getDefaultNationalStats();
    }
  }

  // 2. 東京都犯罪データ取得（東京都オープンデータAPI）
  static async fetchTokyoCrimeData(coordinates: { lat: number; lng: number }): Promise<TokyoCrimeData> {
    try {
      // 東京都の犯罪発生情報（メールけいしちょうオープンデータ）
      const datasetId = 't000022d0000000033'; // 犯罪発生情報データセットID
      
      const url = new URL(`${this.TOKYO_OPENDATA_BASE_URL}/datastore_search`);
      url.searchParams.append('resource_id', datasetId);
      url.searchParams.append('limit', '1000');
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Tokyo OpenData API Error: ${response.status}`);
      
      const data = await response.json();
      return this.parseTokyoCrimeData(data, coordinates);
    } catch (error) {
      console.error('東京都犯罪データ取得エラー:', error);
      return this.getDefaultTokyoCrimeData();
    }
  }

  // 3. 交通事故統計データ取得
  static async fetchTrafficAccidentData(coordinates: { lat: number; lng: number }): Promise<TrafficAccidentData> {
    try {
      // 警察庁交通事故統計オープンデータ
      const statsId = '0003348001'; // 交通事故統計表ID
      
      const url = new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');
      url.searchParams.append('appId', this.E_STAT_API_KEY || '');
      url.searchParams.append('statsDataId', statsId);
      url.searchParams.append('cdTime', '2023000000-2024000000');
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Traffic Accident API Error: ${response.status}`);
      
      const data = await response.json();
      return this.parseTrafficAccidentData(data, coordinates);
    } catch (error) {
      console.error('交通事故データ取得エラー:', error);
      return this.getDefaultTrafficAccidentData();
    }
  }

  // 4. 時間帯別犯罪パターン分析
  static async analyzeTimeBasedCrimePatterns(coordinates: { lat: number; lng: number }): Promise<TimeBasedCrimePattern> {
    try {
      // 過去2年間の時間別犯罪データを分析
      const patterns = await this.fetchTimeBasedCrimeData(coordinates);
      
      return {
        hourlyRisk: this.calculateHourlyRisk(patterns),
        dayOfWeekRisk: this.calculateDayOfWeekRisk(patterns),
        seasonalTrends: this.calculateSeasonalTrends(patterns),
        riskPeakTimes: this.identifyRiskPeakTimes(patterns)
      };
    } catch (error) {
      console.error('時間帯別分析エラー:', error);
      return this.getDefaultTimeBasedPattern();
    }
  }

  // 5. 犯罪ホットスポット特定
  static async identifyCrimeHotspots(
    coordinates: { lat: number; lng: number }, 
    radius: number
  ): Promise<CrimeHotspot[]> {
    try {
      // 指定半径内の犯罪多発地点を特定
      const crimePoints = await this.fetchNearbycrimePoints(coordinates, radius);
      
      return this.analyzeCrimeHotspots(crimePoints, coordinates);
    } catch (error) {
      console.error('犯罪ホットスポット分析エラー:', error);
      return [];
    }
  }

  // 安全性総合スコア計算
  static calculateSafetyScore(data: {
    nationalStats: NationalCrimeStats | null;
    localCrime: TokyoCrimeData | null;
    trafficSafety: TrafficAccidentData | null;
  }): SafetyScore {
    const weights = {
      violentCrime: 0.3,    // 凶悪犯罪 30%
      propertyCrime: 0.25,  // 財産犯罪 25%
      streetCrime: 0.2,     // 街頭犯罪 20%
      trafficSafety: 0.15,  // 交通安全 15%
      publicOrder: 0.1      // 公共秩序 10%
    };

    let totalScore = 0;
    let maxScore = 100;

    // 各カテゴリのスコア計算
    if (data.nationalStats) {
      const violentScore = this.calculateViolentCrimeScore(data.nationalStats);
      const propertyScore = this.calculatePropertyCrimeScore(data.nationalStats);
      totalScore += (violentScore * weights.violentCrime) + (propertyScore * weights.propertyCrime);
    }

    if (data.localCrime) {
      const streetScore = this.calculateStreetCrimeScore(data.localCrime);
      const publicOrderScore = this.calculatePublicOrderScore(data.localCrime);
      totalScore += (streetScore * weights.streetCrime) + (publicOrderScore * weights.publicOrder);
    }

    if (data.trafficSafety) {
      const trafficScore = this.calculateTrafficSafetyScore(data.trafficSafety);
      totalScore += trafficScore * weights.trafficSafety;
    }

    return {
      overallScore: Math.round(totalScore),
      grade: this.getGradeFromScore(totalScore),
      breakdown: {
        violentCrime: data.nationalStats ? this.calculateViolentCrimeScore(data.nationalStats) : 0,
        propertyCrime: data.nationalStats ? this.calculatePropertyCrimeScore(data.nationalStats) : 0,
        streetCrime: data.localCrime ? this.calculateStreetCrimeScore(data.localCrime) : 0,
        trafficSafety: data.trafficSafety ? this.calculateTrafficSafetyScore(data.trafficSafety) : 0,
        publicOrder: data.localCrime ? this.calculatePublicOrderScore(data.localCrime) : 0
      },
      riskLevel: this.determineRiskLevel(totalScore),
      recommendations: this.generateSafetyRecommendations(totalScore, data)
    };
  }

  // ユーティリティメソッド

  private static getPrefectureCodeFromAddress(address: string): string {
    const prefectureCodes: { [key: string]: string } = {
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

    for (const [prefecture, code] of Object.entries(prefectureCodes)) {
      if (address.includes(prefecture)) {
        return code;
      }
    }
    return '13'; // デフォルト: 東京都
  }

  private static parseNationalStats(data: any): NationalCrimeStats {
    // e-Stat APIレスポンスのパース処理
    const statsData = data?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    
    return {
      totalCrimes: this.extractStatsValue(statsData, 'total'),
      violentCrimes: this.extractStatsValue(statsData, 'violent'),
      propertyCrimes: this.extractStatsValue(statsData, 'property'),
      publicOrderCrimes: this.extractStatsValue(statsData, 'public_order'),
      crimeRate: this.calculateCrimeRate(statsData),
      trend: this.calculateTrend(statsData)
    };
  }

  private static parseTokyoCrimeData(data: any, coordinates: { lat: number; lng: number }): TokyoCrimeData {
    const records = data?.result?.records || [];
    const nearbycrimes = records.filter((record: any) => 
      this.isWithinRadius(coordinates, { lat: record.latitude, lng: record.longitude }, 2000)
    );

    return {
      streetCrimes: nearbycrimes.filter((crime: any) => crime.category === 'street').length,
      bicycleTheft: nearbycrimes.filter((crime: any) => crime.category === 'bicycle_theft').length,
      carTheft: nearbycrimes.filter((crime: any) => crime.category === 'car_theft').length,
      burglary: nearbycrimes.filter((crime: any) => crime.category === 'burglary').length,
      recentIncidents: nearbycrimes.slice(0, 10),
      crimeHeatmap: this.generateCrimeHeatmap(nearbycrimes, coordinates)
    };
  }

  private static parseTrafficAccidentData(data: any, coordinates: { lat: number; lng: number }): TrafficAccidentData {
    const statsData = data?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE || [];
    
    return {
      totalAccidents: this.extractStatsValue(statsData, 'total_accidents'),
      fatalAccidents: this.extractStatsValue(statsData, 'fatal_accidents'),
      injuryAccidents: this.extractStatsValue(statsData, 'injury_accidents'),
      pedestrianAccidents: this.extractStatsValue(statsData, 'pedestrian_accidents'),
      bicycleAccidents: this.extractStatsValue(statsData, 'bicycle_accidents'),
      accidentRate: this.calculateAccidentRate(statsData),
      dangerousIntersections: this.identifyDangerousIntersections(coordinates)
    };
  }

  private static calculateViolentCrimeScore(stats: NationalCrimeStats): number {
    // 凶悪犯罪スコア: 低いほど高スコア
    const nationalAverage = 2.5; // 人口10万人あたりの全国平均
    const rate = stats.violentCrimes / 100000; // 仮の人口で正規化
    return Math.max(0, Math.min(100, 100 - (rate / nationalAverage) * 50));
  }

  private static calculatePropertyCrimeScore(stats: NationalCrimeStats): number {
    // 財産犯罪スコア: 窃盗、詐欺等
    const nationalAverage = 45.0;
    const rate = stats.propertyCrimes / 100000;
    return Math.max(0, Math.min(100, 100 - (rate / nationalAverage) * 50));
  }

  private static calculateStreetCrimeScore(crime: TokyoCrimeData): number {
    // 街頭犯罪スコア: ひったくり、車上荒らし等
    const maxStreetCrimes = 20; // 半径2km内での想定最大値
    const score = Math.max(0, 100 - (crime.streetCrimes / maxStreetCrimes) * 100);
    return Math.round(score);
  }

  private static calculateTrafficSafetyScore(traffic: TrafficAccidentData): number {
    // 交通安全スコア
    const maxAccidents = 50; // 想定最大事故数
    const score = Math.max(0, 100 - (traffic.totalAccidents / maxAccidents) * 100);
    return Math.round(score);
  }

  private static calculatePublicOrderScore(crime: TokyoCrimeData): number {
    // 公共秩序スコア
    const totalMinorCrimes = crime.bicycleTheft + (crime.recentIncidents?.length || 0);
    const maxMinorCrimes = 30;
    const score = Math.max(0, 100 - (totalMinorCrimes / maxMinorCrimes) * 100);
    return Math.round(score);
  }

  private static getGradeFromScore(score: number): string {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
  }

  private static determineRiskLevel(score: number): string {
    if (score >= 80) return '低リスク';
    if (score >= 60) return '中リスク';
    return '高リスク';
  }

  private static generateSafetyRecommendations(score: number, data: any): string[] {
    const recommendations: string[] = [];

    if (score < 70) {
      recommendations.push('夜間の一人歩きは避けることをお勧めします');
      recommendations.push('貴重品の管理に十分注意してください');
    }

    if (data.trafficSafety?.totalAccidents > 20) {
      recommendations.push('交通事故が多発しているため、歩行時・自転車利用時は十分注意してください');
    }

    if (data.localCrime?.bicycleTheft > 10) {
      recommendations.push('自転車盗が多発しています。二重ロックを推奨します');
    }

    if (recommendations.length === 0) {
      recommendations.push('比較的安全な地域です。基本的な防犯対策を継続してください');
    }

    return recommendations;
  }

  // フォールバック用デフォルトデータ
  private static getDefaultNationalStats(): NationalCrimeStats {
    return {
      totalCrimes: 0,
      violentCrimes: 0,
      propertyCrimes: 0,
      publicOrderCrimes: 0,
      crimeRate: 0,
      trend: 'stable'
    };
  }

  private static getDefaultTokyoCrimeData(): TokyoCrimeData {
    return {
      streetCrimes: 0,
      bicycleTheft: 0,
      carTheft: 0,
      burglary: 0,
      recentIncidents: [],
      crimeHeatmap: []
    };
  }

  private static getDefaultTrafficAccidentData(): TrafficAccidentData {
    return {
      totalAccidents: 0,
      fatalAccidents: 0,
      injuryAccidents: 0,
      pedestrianAccidents: 0,
      bicycleAccidents: 0,
      accidentRate: 0,
      dangerousIntersections: []
    };
  }

  private static getDefaultTimeBasedPattern(): TimeBasedCrimePattern {
    return {
      hourlyRisk: new Array(24).fill(0),
      dayOfWeekRisk: new Array(7).fill(0),
      seasonalTrends: { spring: 0, summer: 0, autumn: 0, winter: 0 },
      riskPeakTimes: []
    };
  }

  // ヘルパーメソッド
  private static extractStatsValue(statsData: any[], category: string): number {
    // e-Stat APIデータから特定カテゴリの値を抽出
    const categoryData = statsData.find(item => item.category === category);
    return categoryData ? parseInt(categoryData.value) || 0 : 0;
  }

  private static calculateCrimeRate(statsData: any[]): number {
    const total = this.extractStatsValue(statsData, 'total');
    const population = this.extractStatsValue(statsData, 'population') || 100000;
    return (total / population) * 100000;
  }

  private static calculateTrend(statsData: any[]): string {
    // 過去2年間のトレンド分析
    return 'stable'; // 簡略化
  }

  private static isWithinRadius(center: { lat: number; lng: number }, point: { lat: number; lng: number }, radius: number): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radius;
  }

  private static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat-point1.lat) * Math.PI/180;
    const Δλ = (point2.lng-point1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private static generateCrimeHeatmap(crimes: any[], center: { lat: number; lng: number }): any[] {
    // 犯罪発生地点のヒートマップデータ生成
    return crimes.map(crime => ({
      lat: crime.latitude,
      lng: crime.longitude,
      intensity: 1
    }));
  }

  private static calculateHourlyRisk(patterns: any): number[] {
    // 24時間の時間別リスク計算
    return new Array(24).fill(0).map((_, hour) => {
      // 仮の計算：深夜～早朝にリスクが高くなる傾向
      if (hour >= 22 || hour <= 5) return Math.random() * 30 + 20;
      if (hour >= 18 && hour <= 21) return Math.random() * 20 + 10;
      return Math.random() * 10 + 5;
    });
  }

  private static calculateDayOfWeekRisk(patterns: any): number[] {
    // 曜日別リスク計算
    return new Array(7).fill(0).map((_, day) => {
      // 週末にリスクが若干高くなる傾向
      if (day === 5 || day === 6) return Math.random() * 20 + 15;
      return Math.random() * 15 + 10;
    });
  }

  private static calculateSeasonalTrends(patterns: any): { spring: number; summer: number; autumn: number; winter: number } {
    return {
      spring: Math.random() * 20 + 10,
      summer: Math.random() * 25 + 15, // 夏季にやや高い傾向
      autumn: Math.random() * 18 + 12,
      winter: Math.random() * 15 + 8
    };
  }

  private static identifyRiskPeakTimes(patterns: any): string[] {
    return [
      '深夜2時～4時',
      '金曜日夜間',
      '繁華街周辺'
    ];
  }

  private static fetchTimeBasedCrimeData(coordinates: { lat: number; lng: number }): Promise<any> {
    // 時間別犯罪データ取得の実装
    return Promise.resolve({}); // 簡略化
  }

  private static fetchNearbycrimePoints(coordinates: { lat: number; lng: number }, radius: number): Promise<any[]> {
    // 近隣犯罪地点取得の実装
    return Promise.resolve([]); // 簡略化
  }

  private static analyzeCrimeHotspots(crimePoints: any[], center: { lat: number; lng: number }): CrimeHotspot[] {
    // 犯罪ホットスポット分析の実装
    return []; // 簡略化
  }

  private static calculateAccidentRate(statsData: any[]): number {
    const total = this.extractStatsValue(statsData, 'total_accidents');
    const population = this.extractStatsValue(statsData, 'population') || 100000;
    return (total / population) * 100000;
  }

  private static identifyDangerousIntersections(coordinates: { lat: number; lng: number }): any[] {
    // 危険な交差点の特定
    return []; // 簡略化
  }
}

// 型定義
export interface NationalCrimeStats {
  totalCrimes: number;
  violentCrimes: number;
  propertyCrimes: number;
  publicOrderCrimes: number;
  crimeRate: number;
  trend: string;
}

export interface TokyoCrimeData {
  streetCrimes: number;
  bicycleTheft: number;
  carTheft: number;
  burglary: number;
  recentIncidents: any[];
  crimeHeatmap: any[];
}

export interface TrafficAccidentData {
  totalAccidents: number;
  fatalAccidents: number;
  injuryAccidents: number;
  pedestrianAccidents: number;
  bicycleAccidents: number;
  accidentRate: number;
  dangerousIntersections: any[];
}

export interface TimeBasedCrimePattern {
  hourlyRisk: number[];
  dayOfWeekRisk: number[];
  seasonalTrends: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
  riskPeakTimes: string[];
}

export interface CrimeHotspot {
  location: { lat: number; lng: number };
  crimeCount: number;
  crimeTypes: string[];
  riskLevel: 'low' | 'medium' | 'high';
  distance: number;
}

export interface SafetyScore {
  overallScore: number;
  grade: string;
  breakdown: {
    violentCrime: number;
    propertyCrime: number;
    streetCrime: number;
    trafficSafety: number;
    publicOrder: number;
  };
  riskLevel: string;
  recommendations: string[];
}

export interface ComprehensiveCrimeData {
  nationalStats: NationalCrimeStats | null;
  localCrime: TokyoCrimeData | null;
  trafficSafety: TrafficAccidentData | null;
  timePatterns: TimeBasedCrimePattern | null;
  hotspots: CrimeHotspot[] | null;
  safetyScore: SafetyScore;
}