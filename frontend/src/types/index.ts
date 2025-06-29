// 共通の型定義ファイル

// データソースの型定義
export interface DataSource {
  name: string;
  reliability: number;
  category: string;
  lastUpdated: string;
  url?: string;
  methodology?: string;
  sampleSize?: number;
  coverage?: string;
}

// 信頼性分析結果の型定義
export interface CredibleAnalysisResult {
  dataSources: DataSource[];
  overallReliability: number;
  qualityScore: number;
  sourceCount: number;
  lastValidated: string;
  reliabilityBreakdown: {
    [category: string]: number;
  };
  dataFreshness: number;
  crossValidation: boolean;
  confidence: {
    overall: number;
    breakdown: {
      recency: number;
      coverage: number;
      dataQuality: number;
    };
  };
  recommendations: string[];
  limitations: string[];
}

// 一貫性チェック結果の型定義
export interface ConsistentAnalysisResult {
  original: any;
  corrected: any;
  contradictions: Contradiction[];
  qualityScore: number;
  improvements: string[];
  validationResults: ValidationResult[];
}

// 矛盾情報の型定義
export interface Contradiction {
  type: 'score-comment-mismatch' | 'logical-inconsistency' | 'numerical-precision' | 'threshold-violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  original: any;
  suggested: any;
  confidence: number;
}

// 検証結果の型定義
export interface ValidationResult {
  category: string;
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

// ライフスタイルスコアの型定義
export interface LifestyleScore {
  [category: string]: number;
}

// 詳細分析結果の型定義
export interface DetailedAnalysis {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  recommendations: string[];
}

// 将来予測の型定義
export interface FuturePrediction {
  oneYear: string;
  threeYears: string;
  fiveYears: string;
  confidenceLevels: {
    oneYear: number;
    threeYears: number;
    fiveYears: number;
  };
}

// SWOT分析結果の型定義
export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategicRecommendations: string[];
}

// 品質メトリクスの型定義
export interface QualityMetrics {
  consistencyScore: number;
  credibilityScore: number;
  overallQuality: number;
  improvements: string[];
  limitations: string[];
}

// 統合分析結果の最終型定義
export interface FinalAnalysisResult {
  lifestyleScore: LifestyleScore;
  detailedAnalysis: DetailedAnalysis;
  futurePredict: FuturePrediction;
  swotAnalysis: SWOTAnalysis;
  qualityMetrics: QualityMetrics;
}

// 強化された分析結果の型定義
export interface EnhancedAnalysisResult {
  originalAnalysis: any;
  consistentAnalysis: ConsistentAnalysisResult;
  credibilityAnalysis: CredibleAnalysisResult;
  finalResult: FinalAnalysisResult;
}

// コンポーネントプロパティの型定義
export interface CredibilityDisplayProps {
  credibility: CredibleAnalysisResult;
  compact?: boolean;
  showDetails?: boolean;
}

export interface EnhancedAnalysisDisplayProps {
  address: string;
  coordinates?: { lat: number; lng: number };
  onAnalysisComplete?: (result: EnhancedAnalysisResult) => void;
}

// API応答の型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 分析オプションの型定義
export interface AnalysisOptions {
  includeTransport: boolean;
  includeCommercial: boolean;
  includeMedical: boolean;
  includeEducation: boolean;
  includeSafety: boolean;
  includeEnvironment: boolean;
  useGovernmentData: boolean;
  useEstatData: boolean;
  useGoogleMaps: boolean;
  useRealEstateData: boolean;
  enableDetailedAnalysis: boolean;
  enableFuturePrediction: boolean;
  enableSWOTAnalysis: boolean;
  enableMarketAnalysis: boolean;
}

// 分析リクエストの型定義
export interface AnalysisRequest {
  address: string;
  coordinates?: { lat: number; lng: number };
  analysisOptions: AnalysisOptions;
}

// 地理的座標の型定義
export interface Coordinates {
  lat: number;
  lng: number;
}

// エラー情報の型定義
export interface AnalysisError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// React Node の型を明示的にエクスポート
export type ReactNodeType = React.ReactNode;

export default {};
