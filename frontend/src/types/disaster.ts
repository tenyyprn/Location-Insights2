// 災害情報に関する型定義

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'severe' | 'extreme';
  type: 'earthquake' | 'typhoon' | 'flood' | 'landslide' | 'fire' | 'tsunami' | 'volcano' | 'other';
  startTime: string;
  endTime?: string;
  area: string;
  urgency?: 'immediate' | 'expected' | 'future' | 'past';
  certainty?: 'observed' | 'likely' | 'possible' | 'unlikely' | 'unknown';
}

export interface EarthquakeInfo {
  magnitude: number;
  location: string;
  depth: string;
  time: string;
  intensity: string;
  latitude?: number;
  longitude?: number;
  tsunamiThreat?: boolean;
}

export interface TsunamiInfo {
  id: string;
  title: string;
  level: 'advisory' | 'warning' | 'major_warning';
  areas: string[];
  estimatedArrival?: string;
  observedHeight?: string;
  maxHeight?: string;
}

export interface VolcanoInfo {
  name: string;
  alertLevel: number;
  activity: string;
  lastUpdate: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TyphoonInfo {
  id: string;
  name: string;
  status: 'developing' | 'tropical_storm' | 'severe_tropical_storm' | 'typhoon' | 'extratropical';
  pressure: number; // hPa
  maxWind: number; // m/s
  location: {
    latitude: number;
    longitude: number;
  };
  direction: number; // degrees
  speed: number; // km/h
  forecast?: Array<{
    time: string;
    location: { latitude: number; longitude: number };
    pressure: number;
    maxWind: number;
  }>;
}

export interface DisasterRiskAssessment {
  earthquakeRisk: number; // 0-100
  floodRisk: number;
  landslideRisk: number;
  tsunamiRisk: number;
  volcanoRisk: number;
  fireRisk: number;
  overallRisk: number;
  riskFactors: string[];
  recommendations: string[];
  lastUpdated: string;
}

export interface HazardMapData {
  floodZones: Array<{
    level: number; // 浸水深度
    probability: string; // 発生確率
    area: string;
  }>;
  landslideZones: Array<{
    riskLevel: 'yellow' | 'red'; // 警戒区域・特別警戒区域
    type: 'debris_flow' | 'landslide' | 'steep_slope';
    area: string;
  }>;
  earthquakeFaultLines: Array<{
    name: string;
    type: 'active_fault' | 'presumed_fault';
    lastActivity?: string;
    magnitude?: number;
  }>;
  tsunamiEvacuationZones: Array<{
    evacuationBuilding: string;
    capacity: number;
    walkingTime: number; // 分
    address: string;
  }>;
}

export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'evacuation_site' | 'emergency_hospital' | 'fire_station' | 'police_station' | 'government_office';
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  capacity?: number;
  services: string[];
  accessibilityFeatures?: string[];
  emergencySupplies?: string[];
}

export interface DisasterHistory {
  date: string;
  type: 'earthquake' | 'typhoon' | 'flood' | 'landslide' | 'tsunami' | 'volcano';
  name?: string;
  magnitude?: number;
  casualties?: {
    deaths: number;
    injured: number;
    missing: number;
  };
  damage?: {
    housesDestroyed: number;
    housesDamaged: number;
    economicLoss?: number; // 億円単位
  };
  affectedAreas: string[];
  description: string;
}

export interface WeatherCondition {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';
}

export interface DisasterPreparedness {
  emergencyKit: {
    isComplete: boolean;
    items: Array<{
      name: string;
      quantity: number;
      lastChecked?: string;
      expiryDate?: string;
    }>;
  };
  evacuationPlan: {
    primaryRoute: string;
    alternativeRoute: string;
    meetingPoint: string;
    emergencyContacts: Array<{
      name: string;
      relationship: string;
      phone: string;
    }>;
  };
  insuranceCoverage: {
    earthquake: boolean;
    flood: boolean;
    fire: boolean;
    typhoon: boolean;
    landslide: boolean;
  };
}

// API レスポンスの型定義
export interface JMAWeatherResponse {
  publishingOffice: string;
  reportDatetime: string;
  targetDatetime: string;
  headlineText?: string;
  text: string;
  warnings?: Array<{
    code: string;
    name: string;
    status: string;
  }>;
}

export interface JMAEarthquakeResponse {
  eventId: string;
  originTime: string;
  arrivalTime: string;
  hypocenter: {
    name: string;
    latitude: number;
    longitude: number;
    depth: number;
  };
  magnitude: number;
  maxIntensity: string;
  tsunamiInfo?: {
    grade: string;
    areas: string[];
  };
}

export interface USGSEarthquakeResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: Array<{
    type: string;
    properties: {
      mag: number;
      place: string;
      time: number;
      updated: number;
      tz: number;
      url: string;
      detail: string;
      felt?: number;
      cdi?: number;
      mmi?: number;
      alert?: string;
      status: string;
      tsunami: number;
      sig: number;
      net: string;
      code: string;
      ids: string;
      sources: string;
      types: string;
      nst?: number;
      dmin?: number;
      rms: number;
      gap?: number;
      magType: string;
      type: string;
      title: string;
    };
    geometry: {
      type: string;
      coordinates: [number, number, number]; // [longitude, latitude, depth]
    };
    id: string;
  }>;
}

// WebSocket メッセージの型定義
export interface DisasterWebSocketMessage {
  type: 'warning' | 'earthquake' | 'tsunami' | 'typhoon' | 'volcano' | 'weather';
  timestamp: string;
  urgent: boolean;
  data: WeatherAlert | EarthquakeInfo | TsunamiInfo | TyphoonInfo | VolcanoInfo;
}

// 設定・プリファレンスの型定義
export interface DisasterNotificationSettings {
  enablePushNotifications: boolean;
  enableSound: boolean;
  minimumSeverity: 'info' | 'warning' | 'severe' | 'extreme';
  enabledTypes: Array<'earthquake' | 'typhoon' | 'flood' | 'landslide' | 'fire' | 'tsunami' | 'volcano'>;
  targetAreas: string[];
  updateInterval: number; // 分
}

// エラーハンドリングの型定義
export interface DisasterAPIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  retryable: boolean;
}

// 統計・分析データの型定義
export interface DisasterStatistics {
  period: {
    start: string;
    end: string;
  };
  earthquakeCount: number;
  averageMagnitude: number;
  maxMagnitude: number;
  alertsIssued: number;
  affectedPopulation: number;
  economicImpact?: number;
  trends: Array<{
    month: string;
    count: number;
    severity: number;
  }>;
}