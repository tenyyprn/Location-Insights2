// MLIT API関連の型定義

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint extends Coordinates {
  id: string;
  name: string;
  address: string;
  distance: number;
  walkTime: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

// 学校データ
export interface SchoolData extends LocationPoint {
  type: string;
  category: 'elementary' | 'middle' | 'high' | 'university' | 'vocational' | 'other';
}

// 医療機関データ
export interface MedicalData extends LocationPoint {
  type: string;
  specialties: string[];
  emergencyCapable: boolean;
  disasterBase: boolean;
}

// 駅データ
export interface StationData extends LocationPoint {
  line: string;
  operator: string;
  stationCode: string;
  passengerData: PassengerData[];
}

// 乗降客数データ
export interface PassengerData {
  year: number;
  passengers: number;
  trend: 'up' | 'down' | 'stable';
}

// 不動産価格データ
export interface RealEstateData extends Coordinates {
  id: string;
  price: number;
  pricePerSquare: number;
  area: number;
  buildingType: string;
  transactionDate: string;
  distance: number;
}

// アクセシビリティスコア
export interface AccessibilityScore {
  totalScore: number;
  maxScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    education: ScoreBreakdown;
    medical: ScoreBreakdown;
    transportation: ScoreBreakdown;
  };
  averagePrice: number | null;
  summary: string;
}

export interface ScoreBreakdown {
  score: number;
  maxScore: number;
}

// 処理済みデータ
export interface ProcessedSchoolData {
  nearestElementary: SchoolData[];
  nearestMiddle: SchoolData[];
  nearestHigh: SchoolData[];
  nearestUniversity: SchoolData[];
  allSchools: SchoolData[];
  educationGrade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface ProcessedMedicalData {
  nearestGeneral: MedicalData[];
  nearestEmergency: MedicalData[];
  nearestSpecialty: MedicalData[];
  allMedical: MedicalData[];
  medicalGrade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface ProcessedStationData {
  nearestStation: StationData | null;
  allStations: StationData[];
  uniqueLines: string[];
  transportationGrade: 'S' | 'A' | 'B' | 'C' | 'D';
}

// 災害リスクデータ
export interface DisasterAreaData extends Coordinates {
  id: string;
  prefectureName: string;
  municipalityName: string;
  administrativeCode: string;
  designationAuthority: string;
  areaName: string;
  location: string;
  reasonCode: string;
  reason: string;
  reasonDetail: string;
  announcementDate: string;
  announcementNumber: string;
  legalBasis: string;
  area: number;
  scale: string;
  other: string;
  distance: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  geometry: any;
}


// アクセシビリティスコア（災害リスク統合）
export interface AccessibilityScore {
  totalScore: number;
  maxScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    education: ScoreBreakdown;
    medical: ScoreBreakdown;
    transportation: ScoreBreakdown;
  };
  averagePrice: number | null;
  summary: string;
  // 災害リスク統合情報
  disasterRisk?: DisasterRiskAssessment;
  safetyFactors?: string[];
  safetyRecommendation?: string;
}
export interface LandslideRiskData extends Coordinates {
  id: string;
  type: string;
  severity: string;
  areaName: string;
  distance: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  geometry: any;
}

export interface FloodRiskData extends Coordinates {
  id: string;
  type: string;
  depth: string;
  areaName: string;
  riverName: string;
  distance: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
  geometry: any;
}

export interface DisasterRiskAssessment {
  totalScore: number;
  maxScore: number;
  safetyGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  riskFactors: string[];
  breakdown: {
    disasterAreas: number;
    landslideRisk: number;
    floodRisk: number;
  };
  recommendation: string;
  nearestRisks: Array<{
    type: 'disaster' | 'landslide' | 'flood';
    areaName: string;
    distance: number;
    riskLevel: string;
  }>;
}

export interface DisasterRiskData {
  location: {
    lat: number;
    lon: number;
    radius: number;
  };
  disasterAreas: DisasterAreaData[];
  landslideRisk: LandslideRiskData[];
  floodRisk: FloodRiskData[];
  riskAssessment: DisasterRiskAssessment;
}

// 地域分析結果
export interface LocationAnalysis {
  location: {
    lat: number;
    lon: number;
    radius: number;
  };
  schools: SchoolData[];
  medical: MedicalData[];
  stations: StationData[];
  realEstate: RealEstateData[];
  disasterRisk: DisasterRiskData | null;
  analysis: AccessibilityScore;
  totals: {
    schools: number;
    medical: number;
    stations: number;
    realEstate: number;
    disasterAreas?: number;
  };
}

// API レスポンス
export interface MLITApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  api?: string;
  error?: string;
}

export interface LocationAnalysisResponse extends MLITApiResponse<LocationAnalysis> {}

// プロパティ分析リクエスト
export interface PropertyAnalysisRequest {
  address?: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

// プロパティ分析レスポンス
export interface PropertyAnalysisResponse {
  success: boolean;
  message: string;
  data: {
    address?: string;
    coordinates: Coordinates;
    radius: number;
    location: {
      lat: number;
      lon: number;
      radius: number;
    };
    schools: SchoolData[];
    medical: MedicalData[];
    stations: StationData[];
    realEstate: RealEstateData[];
    analysis: AccessibilityScore;
  };
}

// 地図マーカー用データ
export interface MapMarker {
  id: string;
  position: Coordinates;
  title: string;
  type: 'school' | 'medical' | 'station' | 'property';
  grade?: 'S' | 'A' | 'B' | 'C' | 'D';
  info: string;
}

// フィルター設定
export interface FilterSettings {
  schools: {
    elementary: boolean;
    middle: boolean;
    high: boolean;
    university: boolean;
    vocational: boolean;
  };
  medical: {
    general: boolean;
    emergency: boolean;
    specialty: boolean;
  };
  stations: {
    maxDistance: number;
    minPassengers: number;
  };
  radius: number;
}

// 統計データ
export interface StatisticsData {
  educationStats: {
    totalSchools: number;
    averageDistance: number;
    schoolTypes: Record<string, number>;
  };
  medicalStats: {
    totalFacilities: number;
    averageDistance: number;
    emergencyCount: number;
    specialtyCount: number;
  };
  transportationStats: {
    totalStations: number;
    averageDistance: number;
    totalLines: number;
    averagePassengers: number;
  };
  priceStats: {
    averagePrice: number;
    medianPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
  };
}

// チャート用データ
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

// エラーハンドリング
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// ローディング状態
export interface LoadingState {
  schools: boolean;
  medical: boolean;
  stations: boolean;
  realEstate: boolean;
  analysis: boolean;
}

// コンポーネントプロパティ
export interface LocationAnalysisProps {
  analysis: LocationAnalysis | null;
  loading: LoadingState;
  error: ApiError | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

export interface PropertyDetailProps {
  property: {
    id: string;
    address: string;
    coordinates: Coordinates;
    price?: number;
    area?: number;
  };
  analysis?: LocationAnalysis;
  onAnalysisRequest?: (lat: number, lng: number) => void;
}

// ユーティリティ型
export type GradeColor = {
  [K in 'S' | 'A' | 'B' | 'C' | 'D']: string;
};

export type CategoryIcons = {
  [K in 'school' | 'medical' | 'station' | 'property']: string;
};