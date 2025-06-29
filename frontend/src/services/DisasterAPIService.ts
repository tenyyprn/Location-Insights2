// 災害情報API統合サービス
export class DisasterAPIService {
  private static readonly PROXY_BASE_URL = process.env.REACT_APP_PROXY_BASE_URL || 'http://localhost:8001/api/proxy';
  private static readonly JMA_BASE_URL = 'https://www.jma.go.jp/bosai/forecast/data';
  private static readonly USGS_BASE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0';
  private static readonly ENABLE_REAL_API = process.env.REACT_APP_ENABLE_REAL_API === 'true';
  
  // 気象庁の警報・注意報情報を取得
  static async fetchWeatherWarnings(areaCode: string): Promise<any[]> {
    if (!this.ENABLE_REAL_API) {
      console.log('🔧 モックモード: 実際のAPIは無効です');
      return [];
    }

    try {
      console.log(`📡 気象庁API呼び出し: エリアコード ${areaCode}`);
      // プロキシサーバー経由でAPIアクセス
      const warningsUrl = `${this.PROXY_BASE_URL}/jma/warnings/${areaCode}`;
      const response = await fetch(warningsUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ 気象庁API レスポンス受信:', data);
      return this.parseWarnings(data);
    } catch (error) {
      console.error('❌ 気象警報の取得に失敗:', error);
      return [];
    }
  }

  // 地震情報を取得
  static async fetchEarthquakeInfo(): Promise<any[]> {
    if (!this.ENABLE_REAL_API) {
      console.log('🔧 モックモード: 実際のAPIは無効です');
      return [];
    }

    try {
      console.log('📡 気象庁地震情報API呼び出し');
      // 気象庁の地震情報API
      const earthquakeUrl = `${this.PROXY_BASE_URL}/jma/earthquake`;
      const response = await fetch(earthquakeUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ 地震情報API レスポンス受信:', data);
      return this.parseEarthquakes(data);
    } catch (error) {
      console.error('❌ 地震情報の取得に失敗:', error);
      // フォールバック: USGSのAPI使用
      return this.fetchUSGSEarthquakes();
    }
  }

  // USGSの地震情報を取得（フォールバック）
  static async fetchUSGSEarthquakes(): Promise<any[]> {
    if (!this.ENABLE_REAL_API) {
      return [];
    }

    try {
      console.log('📡 USGS地震情報API呼び出し（フォールバック）');
      const usgsUrl = `${this.PROXY_BASE_URL}/usgs/earthquakes`;
      const response = await fetch(usgsUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ USGS API レスポンス受信:', data);
      return this.parseUSGSEarthquakes(data);
    } catch (error) {
      console.error('❌ USGS地震情報の取得に失敗:', error);
      return [];
    }
  }

  // 津波情報を取得
  static async fetchTsunamiInfo(): Promise<any[]> {
    try {
      const tsunamiUrl = `${this.JMA_BASE_URL}/seismo/tsunami/tsunami.json`;
      const response = await fetch(tsunamiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseTsunami(data);
    } catch (error) {
      console.error('津波情報の取得に失敗:', error);
      return [];
    }
  }

  // 火山情報を取得
  static async fetchVolcanoInfo(): Promise<any[]> {
    try {
      const volcanoUrl = `${this.JMA_BASE_URL}/volcano/vinfo.json`;
      const response = await fetch(volcanoUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseVolcano(data);
    } catch (error) {
      console.error('火山情報の取得に失敗:', error);
      return [];
    }
  }

  // 台風情報を取得
  static async fetchTyphoonInfo(): Promise<any[]> {
    try {
      const typhoonUrl = `${this.JMA_BASE_URL}/typhoon/forecast.json`;
      const response = await fetch(typhoonUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseTyphoon(data);
    } catch (error) {
      console.error('台風情報の取得に失敗:', error);
      return [];
    }
  }

  // 統合災害情報取得
  static async fetchAllDisasterInfo(areaCode: string, coordinates?: { lat: number; lng: number }) {
    try {
      const [warnings, earthquakes, tsunamis, volcanoes, typhoons] = await Promise.allSettled([
        this.fetchWeatherWarnings(areaCode),
        this.fetchEarthquakeInfo(),
        this.fetchTsunamiInfo(),
        this.fetchVolcanoInfo(),
        this.fetchTyphoonInfo()
      ]);

      return {
        warnings: warnings.status === 'fulfilled' ? warnings.value : [],
        earthquakes: earthquakes.status === 'fulfilled' ? earthquakes.value : [],
        tsunamis: tsunamis.status === 'fulfilled' ? tsunamis.value : [],
        volcanoes: volcanoes.status === 'fulfilled' ? volcanoes.value : [],
        typhoons: typhoons.status === 'fulfilled' ? typhoons.value : [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('統合災害情報の取得に失敗:', error);
      throw error;
    }
  }

  // 住所から地域コードを取得
  static getAreaCodeFromAddress(address: string): string {
    const prefectureToCode: { [key: string]: string } = {
      '北海道': '01',
      '青森県': '02',
      '岩手県': '03',
      '宮城県': '04',
      '秋田県': '05',
      '山形県': '06',
      '福島県': '07',
      '茨城県': '08',
      '栃木県': '09',
      '群馬県': '10',
      '埼玉県': '11',
      '千葉県': '12',
      '東京都': '13',
      '神奈川県': '14',
      '新潟県': '15',
      '富山県': '16',
      '石川県': '17',
      '福井県': '18',
      '山梨県': '19',
      '長野県': '20',
      '岐阜県': '21',
      '静岡県': '22',
      '愛知県': '23',
      '三重県': '24',
      '滋賀県': '25',
      '京都府': '26',
      '大阪府': '27',
      '兵庫県': '28',
      '奈良県': '29',
      '和歌山県': '30',
      '鳥取県': '31',
      '島根県': '32',
      '岡山県': '33',
      '広島県': '34',
      '山口県': '35',
      '徳島県': '36',
      '香川県': '37',
      '愛媛県': '38',
      '高知県': '39',
      '福岡県': '40',
      '佐賀県': '41',
      '長崎県': '42',
      '熊本県': '43',
      '大分県': '44',
      '宮崎県': '45',
      '鹿児島県': '46',
      '沖縄県': '47'
    };

    for (const [pref, code] of Object.entries(prefectureToCode)) {
      if (address.includes(pref)) {
        return code;
      }
    }
    
    return '13'; // デフォルト: 東京都
  }

  // 警報データのパース
  private static parseWarnings(data: any): any[] {
    if (!data || !data.warnings) return [];
    
    return data.warnings.map((warning: any) => ({
      id: warning.id || `warning-${Date.now()}`,
      title: warning.title || '気象警報',
      description: warning.text || warning.description || '',
      severity: this.mapSeverity(warning.kind),
      type: this.mapWarningType(warning.kind),
      startTime: warning.reportDatetime || new Date().toISOString(),
      endTime: warning.validDatetime,
      area: warning.area?.name || '不明'
    }));
  }

  // 地震データのパース
  private static parseEarthquakes(data: any): any[] {
    if (!data || !data.earthquakes) return [];
    
    return data.earthquakes.map((eq: any) => ({
      magnitude: eq.magnitude || 0,
      location: eq.hypocenter?.name || '不明',
      depth: eq.hypocenter?.depth ? `${eq.hypocenter.depth}km` : '不明',
      time: eq.originTime || new Date().toISOString(),
      intensity: eq.maxIntensity ? `震度${eq.maxIntensity}` : '不明',
      latitude: eq.hypocenter?.latitude,
      longitude: eq.hypocenter?.longitude
    }));
  }

  // USGS地震データのパース
  private static parseUSGSEarthquakes(data: any): any[] {
    if (!data || !data.features) return [];
    
    // 日本周辺の地震のみフィルタ（緯度24-46度、経度123-146度）
    return data.features
      .filter((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        return lat >= 24 && lat <= 46 && lng >= 123 && lng <= 146;
      })
      .map((feature: any) => {
        const props = feature.properties;
        const [lng, lat, depth] = feature.geometry.coordinates;
        
        return {
          magnitude: props.mag || 0,
          location: props.place || '日本周辺',
          depth: depth ? `${Math.round(depth)}km` : '不明',
          time: new Date(props.time).toLocaleString('ja-JP'),
          intensity: this.magnitudeToJapaneseIntensity(props.mag),
          latitude: lat,
          longitude: lng
        };
      })
      .slice(0, 10); // 最新10件
  }

  // 津波データのパース
  private static parseTsunami(data: any): any[] {
    if (!data || !data.tsunami) return [];
    
    return data.tsunami.map((tsunami: any) => ({
      id: tsunami.id,
      title: tsunami.title || '津波情報',
      level: tsunami.grade,
      areas: tsunami.areas || [],
      estimatedArrival: tsunami.estimatedArrival,
      observedHeight: tsunami.observedHeight
    }));
  }

  // 火山データのパース
  private static parseVolcano(data: any): any[] {
    if (!data || !data.volcanoes) return [];
    
    return data.volcanoes.map((volcano: any) => ({
      name: volcano.name,
      alertLevel: volcano.alertLevel,
      activity: volcano.activity,
      lastUpdate: volcano.lastUpdate
    }));
  }

  // 台風データのパース
  private static parseTyphoon(data: any): any[] {
    if (!data || !data.typhoons) return [];
    
    return data.typhoons.map((typhoon: any) => ({
      id: typhoon.id,
      name: typhoon.name,
      status: typhoon.status,
      pressure: typhoon.pressure,
      maxWind: typhoon.maxWind,
      location: typhoon.location,
      direction: typhoon.direction,
      speed: typhoon.speed
    }));
  }

  // 警報の種別をマッピング
  private static mapSeverity(kind: string): 'info' | 'warning' | 'severe' | 'extreme' {
    if (kind?.includes('特別警報')) return 'extreme';
    if (kind?.includes('警報')) return 'severe';
    if (kind?.includes('注意報')) return 'warning';
    return 'info';
  }

  // 警報のタイプをマッピング
  private static mapWarningType(kind: string): string {
    if (kind?.includes('地震')) return 'earthquake';
    if (kind?.includes('津波')) return 'tsunami';
    if (kind?.includes('台風') || kind?.includes('暴風')) return 'typhoon';
    if (kind?.includes('大雨') || kind?.includes('洪水')) return 'flood';
    if (kind?.includes('土砂災害')) return 'landslide';
    if (kind?.includes('火災')) return 'fire';
    return 'other';
  }

  // マグニチュードを日本の震度に変換（概算）
  private static magnitudeToJapaneseIntensity(magnitude: number): string {
    if (magnitude >= 7.0) return '震度6強以上';
    if (magnitude >= 6.5) return '震度6弱';
    if (magnitude >= 6.0) return '震度5強';
    if (magnitude >= 5.5) return '震度5弱';
    if (magnitude >= 5.0) return '震度4';
    if (magnitude >= 4.5) return '震度3';
    if (magnitude >= 4.0) return '震度2';
    if (magnitude >= 3.5) return '震度1';
    return '震度0';
  }
}

// リアルタイム更新用のWebSocket接続クラス
export class DisasterWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: ((data: any) => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // 気象庁のWebSocket接続（実際のエンドポイントに置き換え）
      this.ws = new WebSocket('wss://www.jma.go.jp/bosai/ws/warning');
      
      this.ws.onopen = () => {
        console.log('災害情報WebSocket接続が確立されました');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('WebSocketメッセージの解析エラー:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket接続エラー:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket接続が閉じられました。再接続を試行します...');
        setTimeout(() => this.connect(), 5000); // 5秒後に再接続
      };
    } catch (error) {
      console.error('WebSocket接続の初期化に失敗:', error);
    }
  }

  public addListener(callback: (data: any) => void) {
    this.listeners.push(callback);
  }

  public removeListener(callback: (data: any) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('リスナーの実行エラー:', error);
      }
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}