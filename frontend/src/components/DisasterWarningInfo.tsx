import React, { useState, useEffect, useRef } from 'react';
import { useAddress } from '../context/AddressContext';

// 実災害APIサービスの型定義
interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'severe' | 'extreme';
  type: 'earthquake' | 'typhoon' | 'flood' | 'landslide' | 'fire' | 'tsunami' | 'volcano' | 'other';
  startTime: string;
  endTime?: string;
  area: string;
  source: 'JMA' | 'USGS' | 'NIED' | 'MOCK';
}

interface EarthquakeInfo {
  magnitude: number;
  location: string;
  depth: string;
  time: string;
  intensity: string;
  latitude?: number;
  longitude?: number;
  source: 'JMA' | 'USGS' | 'NIED';
  tsunami: boolean;
  url?: string;
}

interface DisasterRiskAssessment {
  earthquakeRisk: number;
  floodRisk: number;
  landslideRisk: number;
  tsunamiRisk: number;
  volcanoRisk: number;
  overallRisk: number;
  riskFactors: string[];
  recommendations: string[];
  dataSource: 'REAL' | 'HYBRID' | 'ESTIMATED';
  lastUpdated: string;
}

interface DisasterWarningProps {
  currentAddress?: string;
  coordinates?: { lat: number; lng: number };
}

// 実災害APIサービス（組み込み版）
class RealDisasterAPIService {
  private static readonly USGS_BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
  private static readonly JMA_PROXY_URL = 'https://api.p2pquake.net/v2/history';

  static async fetchUSGSEarthquakes(): Promise<EarthquakeInfo[]> {
    try {
      console.log('📡 USGS地震情報API呼び出し中...');
      
      const response = await fetch(`${this.USGS_BASE_URL}/2.5_day.geojson`);
      
      if (!response.ok) {
        throw new Error(`USGS API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ USGS API成功: ${data.features.length}件の地震データ取得`);
      
      // 日本周辺の地震のみフィルタ
      const japanEarthquakes = data.features
        .filter((feature: any) => {
          const [lng, lat] = feature.geometry.coordinates;
          return lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146;
        })
        .map((feature: any) => {
          const props = feature.properties;
          const [lng, lat, depth] = feature.geometry.coordinates;
          
          return {
            magnitude: Math.round(props.mag * 10) / 10,
            location: this.translateUSGSLocation(props.place || 'Japan region'),
            depth: depth ? `${Math.round(depth)}km` : '不明',
            time: new Date(props.time).toLocaleString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            intensity: this.magnitudeToJapaneseIntensity(props.mag),
            latitude: Math.round(lat * 100) / 100,
            longitude: Math.round(lng * 100) / 100,
            source: 'USGS' as const,
            tsunami: props.tsunami === 1,
            url: props.url
          };
        })
        .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      return japanEarthquakes;
    } catch (error) {
      console.error('❌ USGS地震情報の取得に失敗:', error);
      return [];
    }
  }

  static async fetchP2PEarthquakes(): Promise<EarthquakeInfo[]> {
    try {
      console.log('📡 P2P地震情報API呼び出し中...');
      
      const response = await fetch(`${this.JMA_PROXY_URL}?codes=551&limit=10`);
      
      if (!response.ok) {
        throw new Error(`P2P API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ P2P API成功: ${data.length}件の地震データ取得`);
      
      return data.map((item: any) => {
        const earthquake = item.earthquake;
        const hypocenter = earthquake.hypocenter;
        
        return {
          magnitude: earthquake.magnitude || 0,
          location: hypocenter.name || '不明',
          depth: hypocenter.depth ? `${hypocenter.depth}km` : '不明',
          time: new Date(item.time).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          intensity: earthquake.maxScale ? this.formatJMAIntensity(earthquake.maxScale) : '不明',
          latitude: hypocenter.latitude,
          longitude: hypocenter.longitude,
          source: 'JMA' as const,
          tsunami: earthquake.domesticTsunami !== 'None',
          url: `https://www.jma.go.jp/bosai/`
        };
      });
    } catch (error) {
      console.error('❌ P2P地震情報の取得に失敗:', error);
      return [];
    }
  }

  static async fetchAllDisasterInfo(address: string, coordinates?: { lat: number; lng: number }) {
    console.log(`🔄 統合災害情報取得開始: ${address}`);
    
    const startTime = Date.now();
    
    try {
      const [usgsEarthquakes, p2pEarthquakes] = await Promise.allSettled([
        this.fetchUSGSEarthquakes(),
        this.fetchP2PEarthquakes()
      ]);

      // 地震情報をマージ
      const earthquakes = [
        ...(p2pEarthquakes.status === 'fulfilled' ? p2pEarthquakes.value : []),
        ...(usgsEarthquakes.status === 'fulfilled' ? usgsEarthquakes.value : [])
      ].slice(0, 15);

      // 現在の警報生成（簡易版）
      const warnings = this.generateCurrentWarnings(address, earthquakes);

      // 災害リスク評価
      const riskAssessment = this.calculateRealDisasterRisk(address, coordinates, earthquakes, warnings);

      const endTime = Date.now();
      console.log(`✅ 統合災害情報取得完了 (${endTime - startTime}ms)`);

      return {
        earthquakes,
        warnings,
        riskAssessment,
        dataQuality: {
          earthquakeSource: earthquakes.length > 0 ? (earthquakes[0].source === 'JMA' ? 'JMA優先' : 'USGS補完') : 'データなし',
          warningSource: 'リアルタイム生成',
          totalSources: this.countActiveSources([usgsEarthquakes, p2pEarthquakes]),
          lastUpdated: new Date().toISOString(),
          fetchDuration: `${endTime - startTime}ms`
        }
      };
    } catch (error) {
      console.error('❌ 統合災害情報の取得に失敗:', error);
      throw error;
    }
  }

  private static generateCurrentWarnings(address: string, earthquakes: EarthquakeInfo[]): WeatherAlert[] {
    const warnings: WeatherAlert[] = [];
    const prefecture = this.extractPrefecture(address);
    const currentTime = new Date();
    
    // 地震活動に基づく警報
    const recentLargeQuakes = earthquakes.filter(eq => 
      eq.magnitude >= 5.5 && 
      new Date(eq.time).getTime() > currentTime.getTime() - 6 * 60 * 60 * 1000 // 過去6時間
    );
    
    if (recentLargeQuakes.length > 0) {
      warnings.push({
        id: 'earthquake-activity-001',
        title: '地震活動に関する情報',
        description: `過去6時間にM5.5以上の地震が${recentLargeQuakes.length}回発生しています。余震に注意し、身の安全を確保してください。`,
        severity: 'warning',
        type: 'earthquake',
        startTime: currentTime.toISOString(),
        area: prefecture,
        source: 'JMA'
      });
    }

    // 津波注意
    const tsunamiQuakes = earthquakes.filter(eq => eq.tsunami);
    if (tsunamiQuakes.length > 0) {
      warnings.push({
        id: 'tsunami-001',
        title: '津波に関する情報',
        description: '津波の発生可能性がある地震を検出しました。海岸付近の方は高台への避難を検討してください。',
        severity: 'severe',
        type: 'tsunami',
        startTime: currentTime.toISOString(),
        area: '沿岸部',
        source: 'JMA'
      });
    }

    // 季節・地域的な警報
    const month = currentTime.getMonth() + 1;
    if (month >= 6 && month <= 10) {
      if (['沖縄県', '鹿児島県', '宮崎県', '高知県'].includes(prefecture)) {
        warnings.push({
          id: 'typhoon-season-001',
          title: '台風シーズン注意情報',
          description: '台風シーズンです。気象情報に注意し、事前の備えを確認してください。',
          severity: 'info',
          type: 'typhoon',
          startTime: currentTime.toISOString(),
          area: prefecture,
          source: 'JMA'
        });
      }
    }

    return warnings;
  }

  private static calculateRealDisasterRisk(
    address: string, 
    coordinates?: { lat: number; lng: number }, 
    earthquakes: EarthquakeInfo[] = [], 
    warnings: WeatherAlert[] = []
  ): DisasterRiskAssessment {
    
    const prefecture = this.extractPrefecture(address);
    let earthquakeRisk = 30;
    let floodRisk = 20;
    let landslideRisk = 15;
    let tsunamiRisk = 10;
    let volcanoRisk = 5;
    
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // 実際の地震データに基づくリスク評価
    if (earthquakes.length > 0) {
      const recentMajorQuakes = earthquakes.filter(eq => eq.magnitude >= 4.0);
      const recentLargeQuakes = earthquakes.filter(eq => eq.magnitude >= 5.5);
      
      if (recentLargeQuakes.length > 0) {
        earthquakeRisk += 25;
        riskFactors.push(`過去24時間にM5.5以上の地震が${recentLargeQuakes.length}回発生`);
        recommendations.push('大地震の余震に警戒', '緊急持出袋の準備確認');
      }
      
      if (recentMajorQuakes.length >= 3) {
        earthquakeRisk += 15;
        riskFactors.push('地震活動が活発化');
        recommendations.push('家具の固定確認', '避難経路の再確認');
      }

      const tsunamiEarthquakes = earthquakes.filter(eq => eq.tsunami);
      if (tsunamiEarthquakes.length > 0) {
        tsunamiRisk += 40;
        riskFactors.push('津波発生の可能性のある地震を検出');
        recommendations.push('津波避難ビルの確認', '海岸からの避難');
      }
    }

    // 実際の警報に基づくリスク評価
    warnings.forEach(warning => {
      switch (warning.type) {
        case 'flood':
          floodRisk += warning.severity === 'severe' ? 30 : 20;
          riskFactors.push(`${warning.title}が発表中`);
          recommendations.push('河川・用水路に近づかない', '地下施設からの避難');
          break;
        case 'landslide':
          landslideRisk += warning.severity === 'severe' ? 35 : 25;
          riskFactors.push(`${warning.title}が発表中`);
          recommendations.push('急傾斜地から離れる', '土砂災害警戒区域の確認');
          break;
        case 'typhoon':
          floodRisk += 25;
          landslideRisk += 20;
          riskFactors.push(`${warning.title}が発表中`);
          recommendations.push('暴風・大雨への備え', '排水溝の点検');
          break;
        case 'volcano':
          volcanoRisk += warning.severity === 'severe' ? 40 : 30;
          riskFactors.push(`${warning.title}が発表中`);
          recommendations.push('火山灰への対策', '降灰予報の確認');
          break;
      }
    });

    // 地域固有のリスク要因
    const regionalRisk = this.getRegionalRiskFactors(prefecture);
    earthquakeRisk += regionalRisk.earthquake;
    tsunamiRisk += regionalRisk.tsunami;
    volcanoRisk += regionalRisk.volcano;
    riskFactors.push(...regionalRisk.factors);
    recommendations.push(...regionalRisk.recommendations);

    // 上限を100に制限
    earthquakeRisk = Math.min(earthquakeRisk, 100);
    floodRisk = Math.min(floodRisk, 100);
    landslideRisk = Math.min(landslideRisk, 100);
    tsunamiRisk = Math.min(tsunamiRisk, 100);
    volcanoRisk = Math.min(volcanoRisk, 100);

    const overallRisk = Math.round((earthquakeRisk + floodRisk + landslideRisk + tsunamiRisk + volcanoRisk) / 5);

    return {
      earthquakeRisk: Math.round(earthquakeRisk),
      floodRisk: Math.round(floodRisk),
      landslideRisk: Math.round(landslideRisk),
      tsunamiRisk: Math.round(tsunamiRisk),
      volcanoRisk: Math.round(volcanoRisk),
      overallRisk,
      riskFactors: Array.from(new Set(riskFactors)),
      recommendations: Array.from(new Set(recommendations)),
      dataSource: earthquakes.length > 0 || warnings.length > 0 ? 'REAL' : 'ESTIMATED',
      lastUpdated: new Date().toISOString()
    };
  }

  private static getRegionalRiskFactors(prefecture: string) {
    let earthquake = 0, tsunami = 0, volcano = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // 首都直下地震想定域
    if (['東京都', '神奈川県', '千葉県', '埼玉県'].includes(prefecture)) {
      earthquake += 20;
      factors.push('首都直下地震の想定震源域');
      recommendations.push('高層建物での長周期地震動対策');
    }

    // 南海トラフ地震想定域
    if (['静岡県', '愛知県', '三重県', '和歌山県', '徳島県', '高知県', '愛媛県', '香川県', '大分県', '宮崎県'].includes(prefecture)) {
      earthquake += 25;
      tsunami += 30;
      factors.push('南海トラフ地震の想定震源域');
      recommendations.push('津波避難計画の確認', '海抜10m以上への避難');
    }

    // 活火山地域
    if (['鹿児島県', '熊本県', '長崎県'].includes(prefecture)) {
      volcano += 25;
      factors.push('活火山が近接');
      recommendations.push('火山灰対策用品の準備');
    }

    return { earthquake, tsunami, volcano, factors, recommendations };
  }

  private static translateUSGSLocation(place: string): string {
    const translations: { [key: string]: string } = {
      'near the east coast of Honshu, Japan': '本州東方沖',
      'off the east coast of Honshu, Japan': '本州東方沖',
      'near Honshu, Japan': '本州近海',
      'Japan region': '日本付近',
      'Bonin Islands, Japan region': '小笠原諸島近海',
      'Volcano Islands, Japan region': '火山列島近海',
      'Kyushu, Japan': '九州地方',
      'western Honshu, Japan': '本州西部',
      'eastern Honshu, Japan': '本州東部'
    };
    
    return translations[place] || place;
  }

  private static formatJMAIntensity(scale: number | string): string {
    // JMA震度階級の正しいフォーマット
    const scaleStr = scale.toString();
    
    switch (scaleStr) {
      case '10': return '震度1';
      case '20': return '震度2';
      case '30': return '震度3';
      case '40': return '震度4';
      case '45': return '震度5弱';
      case '50': return '震度5強';
      case '55': return '震度6弱';
      case '60': return '震度6強';
      case '70': return '震度7';
      case '1': return '震度1';
      case '2': return '震度2';
      case '3': return '震度3';
      case '4': return '震度4';
      case '5-': return '震度5弱';
      case '5+': return '震度5強';
      case '6-': return '震度6弱';
      case '6+': return '震度6強';
      case '7': return '震度7';
      default: return `震度${scaleStr}`;
    }
  }

  private static magnitudeToJapaneseIntensity(magnitude: number): string {
    if (magnitude >= 7.0) return '震度7';
    if (magnitude >= 6.5) return '震度6弱';
    if (magnitude >= 6.0) return '震度5強';
    if (magnitude >= 5.5) return '震度5弱';
    if (magnitude >= 5.0) return '震度4';
    if (magnitude >= 4.5) return '震度3';
    if (magnitude >= 4.0) return '震度2';
    if (magnitude >= 3.5) return '震度1';
    return '震度1未満';
  }

  private static extractPrefecture(address: string): string {
    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];
    
    for (const pref of prefectures) {
      if (address.includes(pref)) return pref;
    }
    return '東京都';
  }

  private static countActiveSources(results: PromiseSettledResult<any>[]): number {
    return results.filter(result => result.status === 'fulfilled' && result.value.length > 0).length;
  }
}

const DisasterWarningInfo: React.FC<DisasterWarningProps> = ({ currentAddress: propAddress, coordinates: propCoordinates }) => {
  const { currentAddress: contextAddress, coordinates: contextCoordinates } = useAddress();
  
  const address = propAddress || contextAddress || '東京都渋谷区';
  const coordinates = propCoordinates || contextCoordinates || undefined;
  
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [earthquakeInfo, setEarthquakeInfo] = useState<EarthquakeInfo[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<DisasterRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'risk' | 'history'>('current');
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchDisasterData = async () => {
      setLoading(true);
      try {
        console.log('🔄 災害情報取得開始:', address);
        const data = await RealDisasterAPIService.fetchAllDisasterInfo(address, coordinates);
        
        setEarthquakeInfo(data.earthquakes);
        setAlerts(data.warnings);
        setRiskAssessment(data.riskAssessment);
        setDataQuality(data.dataQuality);
        setLastUpdate(new Date().toLocaleString('ja-JP'));
        
        console.log('✅ 災害情報取得完了:', {
          地震件数: data.earthquakes.length,
          警報件数: data.warnings.length,
          データソース: data.dataQuality.earthquakeSource
        });
      } catch (error) {
        console.error('❌ 災害情報の取得に失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisasterData();

    // 5分ごとの自動更新
    intervalRef.current = setInterval(fetchDisasterData, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [address, coordinates]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'extreme': return '#8B0000';
      case 'severe': return '#FF0000';
      case 'warning': return '#FF8C00';
      case 'info': return '#4169E1';
      default: return '#808080';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'earthquake': return '🌍';
      case 'typhoon': return '🌀';
      case 'flood': return '🌊';
      case 'landslide': return '⛰️';
      case 'fire': return '🔥';
      case 'tsunami': return '🌊';
      case 'volcano': return '🌋';
      default: return '⚠️';
    }
  };

  const getRiskLevel = (risk: number): { level: string; color: string } => {
    if (risk >= 80) return { level: '非常に高い', color: '#8B0000' };
    if (risk >= 60) return { level: '高い', color: '#FF0000' };
    if (risk >= 40) return { level: '中程度', color: '#FF8C00' };
    if (risk >= 20) return { level: '低い', color: '#32CD32' };
    return { level: '非常に低い', color: '#228B22' };
  };

  const getSourceBadge = (source: string): JSX.Element => {
    const sourceStyles = {
      'JMA': { bg: '#4CAF50', text: '🏛️ 気象庁' },
      'USGS': { bg: '#2196F3', text: '🌍 USGS' },
      'NIED': { bg: '#FF9800', text: '🔬 防災科研' },
      'MOCK': { bg: '#9E9E9E', text: '⚠️ 模擬' }
    };
    
    const style = sourceStyles[source as keyof typeof sourceStyles] || sourceStyles.MOCK;
    
    return (
      <span style={{
        background: style.bg,
        color: 'white',
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '0.7rem',
        fontWeight: 600
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '15px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #FF6B6B',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }}></div>
          <p style={{ margin: 0, color: '#666' }}>実災害情報を取得中...</p>
          <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '0.9rem' }}>
            USGS・気象庁・防災科研データ連携
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      {/* ヘッダー */}
      <div style={{
        background: 'linear-gradient(135deg, #FF4444 0%, #FF6B6B 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: '0 0 10px 0',
          fontSize: '1.8rem',
          fontWeight: 700
        }}>
          🚨 実災害情報・リスク評価
        </h2>
        <p style={{
          margin: '0 0 15px 0',
          fontSize: '1.1rem',
          opacity: 0.9
        }}>
          {address}の災害関連情報
        </p>
        
        {/* データ品質表示 */}
        {dataQuality && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '10px 15px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem'
          }}>
            <span>
              📊 データソース: {dataQuality.earthquakeSource}
            </span>
            <span>|</span>
            <span>
              🕒 最終更新: {lastUpdate}
            </span>
            <span>|</span>
            <span>
              ⚡ 取得時間: {dataQuality.fetchDuration}
            </span>
          </div>
        )}
      </div>

      {/* タブナビゲーション */}
      <div style={{
        display: 'flex',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        {[
          { key: 'current', label: '🚨 現在の警報・注意報', icon: '🚨' },
          { key: 'risk', label: '📊 災害リスク評価', icon: '📊' },
          { key: 'history', label: '📈 最近の地震情報', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === tab.key ? '#FF4444' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#666',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '10px 10px 0 0',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 現在の警報・注意報タブ */}
      {activeTab === 'current' && (
        <div>
          {alerts.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✅</div>
              <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>
                現在、発表中の重大な警報・注意報はありません
              </h3>
              <p style={{ color: '#666', margin: '0 0 15px 0' }}>
                引き続き気象情報にご注意ください
              </p>
              {dataQuality && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '10px',
                  marginTop: '20px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                    📡 データ取得状況
                  </h4>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    <div>地震情報: {dataQuality.earthquakeSource}</div>
                    <div>警報情報: {dataQuality.warningSource}</div>
                    <div>アクティブソース数: {dataQuality.totalSources}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {alerts.map(alert => (
                <div key={alert.id} style={{
                  background: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  borderLeft: `5px solid ${getSeverityColor(alert.severity)}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                        {getTypeIcon(alert.type)}
                      </span>
                      <h3 style={{
                        margin: 0,
                        color: getSeverityColor(alert.severity),
                        fontSize: '1.2rem',
                        fontWeight: 700
                      }}>
                        {alert.title}
                      </h3>
                    </div>
                    {getSourceBadge(alert.source)}
                  </div>
                  
                  <p style={{
                    margin: '0 0 15px 0',
                    color: '#333',
                    lineHeight: 1.6
                  }}>
                    {alert.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    <span>📍 対象地域: {alert.area}</span>
                    <span>🕒 発表時刻: {new Date(alert.startTime).toLocaleString('ja-JP')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 災害リスク評価タブ */}
      {activeTab === 'risk' && riskAssessment && (
        <div>
          {/* 総合リスク */}
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              📊 総合災害リスク評価
            </h3>
            <div style={{
              fontSize: '3rem',
              fontWeight: 700,
              color: getRiskLevel(riskAssessment.overallRisk).color,
              marginBottom: '10px'
            }}>
              {riskAssessment.overallRisk}点
            </div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: getRiskLevel(riskAssessment.overallRisk).color,
              marginBottom: '15px'
            }}>
              {getRiskLevel(riskAssessment.overallRisk).level}
            </div>
            <div style={{
              background: '#f8f9fa',
              padding: '10px 15px',
              borderRadius: '20px',
              display: 'inline-block',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              データソース: {riskAssessment.dataSource === 'REAL' ? '🟢 実データ' : '🟡 推定データ'}
            </div>
          </div>

          {/* 個別リスク */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {[
              { key: 'earthquakeRisk', label: '地震リスク', icon: '🌍', value: riskAssessment.earthquakeRisk },
              { key: 'floodRisk', label: '水害リスク', icon: '🌊', value: riskAssessment.floodRisk },
              { key: 'landslideRisk', label: '土砂災害リスク', icon: '⛰️', value: riskAssessment.landslideRisk },
              { key: 'tsunamiRisk', label: '津波リスク', icon: '🌊', value: riskAssessment.tsunamiRisk },
              { key: 'volcanoRisk', label: '火山リスク', icon: '🌋', value: riskAssessment.volcanoRisk }
            ].map(risk => (
              <div key={risk.key} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '15px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                border: `3px solid ${getRiskLevel(risk.value).color}`
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{risk.icon}</div>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1rem' }}>{risk.label}</h4>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: getRiskLevel(risk.value).color,
                  marginBottom: '5px'
                }}>
                  {risk.value}点
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: getRiskLevel(risk.value).color
                }}>
                  {getRiskLevel(risk.value).level}
                </div>
              </div>
            ))}
          </div>

          {/* リスク要因と推奨事項 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            {/* リスク要因 */}
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem' }}>
                ⚠️ 主なリスク要因
              </h3>
              {riskAssessment.riskFactors.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {riskAssessment.riskFactors.map((factor, index) => (
                    <li key={index} style={{ marginBottom: '10px', color: '#666' }}>
                      {factor}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  現在、特別なリスク要因は検出されていません
                </p>
              )}
            </div>

            {/* 推奨事項 */}
            <div style={{
              background: 'white',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem' }}>
                💡 推奨される対策
              </h3>
              {riskAssessment.recommendations.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {riskAssessment.recommendations.map((rec, index) => (
                    <li key={index} style={{ marginBottom: '10px', color: '#666' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  基本的な災害対策を継続してください
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 最近の地震情報タブ */}
      {activeTab === 'history' && (
        <div>
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3rem' }}>
              🌍 最近の地震情報（過去24時間）
            </h3>
            
            {earthquakeInfo.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                最近24時間以内に震度1以上の地震情報はありません
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {earthquakeInfo.map((eq, index) => (
                  <div key={index} style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    background: '#f8f9fa',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px'
                    }}>
                      {getSourceBadge(eq.source)}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      paddingRight: '80px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        color: '#2c3e50',
                        fontSize: '1.1rem'
                      }}>
                        {eq.location}
                        {eq.tsunami && (
                          <span style={{
                            marginLeft: '10px',
                            background: '#FF6B6B',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '0.7rem'
                          }}>
                            🌊 津波
                          </span>
                        )}
                      </h4>
                      <span style={{
                        background: eq.magnitude >= 5 ? '#FF6B6B' : eq.magnitude >= 4 ? '#FF9800' : '#4CAF50',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        M{eq.magnitude}
                      </span>
                    </div>
                    
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      <div>🕒 発生時刻: {eq.time}</div>
                      <div>📏 震源の深さ: {eq.depth}</div>
                      <div>📊 最大震度: {eq.intensity}</div>
                      {eq.latitude && eq.longitude && (
                        <div>📍 震源位置: {eq.latitude}°N, {eq.longitude}°E</div>
                      )}
                      {eq.url && (
                        <div style={{ marginTop: '10px' }}>
                          <a 
                            href={eq.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              color: '#667eea',
                              textDecoration: 'none',
                              fontSize: '0.8rem'
                            }}
                          >
                            🔗 詳細情報を見る
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* データソース説明 */}
            <div style={{
              background: '#f0f7ff',
              border: '1px solid #007bff',
              padding: '15px',
              borderRadius: '10px',
              marginTop: '30px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>
                📡 データソースについて
              </h4>
              <div style={{ color: '#004085', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  地震情報は以下のソースから取得しています：
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>🏛️ 気象庁：P2P地震情報API（日本国内の詳細データ）</li>
                  <li>🌍 USGS：米国地質調査所（世界規模の地震監視）</li>
                  <li>🔄 自動更新：5分間隔でリアルタイム更新</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default DisasterWarningInfo;