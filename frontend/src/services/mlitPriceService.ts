// 国土交通省 不動産取引価格情報 API統合実装
// バックエンドサーバー経由でAPIにアクセス

interface MLITPropertyTransaction {
  // 基本情報
  Type: string;              // 種類（中古マンション等、宅地等）
  Region: string;            // 地域コード
  MunicipalityCode: string;  // 市区町村コード
  Prefecture: string;        // 都道府県名
  Municipality: string;      // 市区町村名
  DistrictName: string;      // 地区名
  
  // 価格情報
  TradePrice: number;        // 取引価格（総額）
  PricePerUnit: number;      // 単価（坪単価または㎡単価）
  UnitPrice: number;         // ㎡単価
  
  // 物件情報
  FloorPlan: string;         // 間取り
  Area: number;              // 面積（㎡）
  BuildingYear: string;      // 建築年
  Structure: string;         // 構造
  Use: string;               // 用途
  Purpose: string;           // 今後の利用目的
  Direction: string;         // 前面道路の方位
  Classification: string;    // 分類
  Breadth: number;           // 前面道路の幅員（m）
  
  // 立地情報
  CityPlanning: string;      // 都市計画
  CoverageRatio: number;     // 建ぺい率（%）
  FloorAreaRatio: number;    // 容積率（%）
  Period: string;            // 取引時期
  Renovation: string;        // リノベーション
  Remarks: string;           // 備考
  
  // 最寄り駅情報
  NearestStation: string;    // 最寄駅：名称
  TimeToNearestStation: string; // 最寄駅：距離（分）
  
  // 座標情報
  Latitude: number;          // 緯度
  Longitude: number;         // 経度
}

interface PropertyPriceEstimation {
  estimatedPrice?: number;
  confidence: number;
  priceRange?: {
    min: number;
    max: number;
  };
  comparableTransactions: MLITPropertyTransaction[];
  factors?: {
    location: number;
    building: number;
    market: number;
  };
  methodology: string[];
  // 新しいレスポンス形式に対応
  analysis_type?: string;
  title?: string;
  subtitle?: string;
  transaction_examples?: any[];
  market_analysis?: any;
  price_trends?: any;
  location_insights?: any;
  reference_estimate?: {
    estimated_price: number;
    note: string;
  };
  real_data_confirmation?: string; // 追加
}

class MLITPropertyPriceService {
  private readonly apiBaseUrl = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:8000/api'; // 開発環境では直接バックエンドにアクセス
  
  /**
   * 不動産価格を推定（バックエンド経由）
   */
  async estimatePropertyPrice(
    address: string,
    propertyData: {
      area: number;           // 面積（㎡）
      buildingYear: number;   // 建築年
      structure: string;      // 構造
      floorPlan: string;      // 間取り
      stationDistance: number; // 駅距離（分）
      coordinates: { lat: number; lng: number };
    }
  ): Promise<any> { // 柔軟なレスポンス処理のためany型を使用
    try {
      console.log('🏛️ バックエンド経由で不動産価格推定APIを呼び出し中...', { address, propertyData });
      
      const response = await fetch(`${this.apiBaseUrl}/estimate-property-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // キャッシュ無効化
        },
        body: JSON.stringify({
          address,
          propertyData
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ 不動産価格推定成功:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ 不動産価格推定API呼び出しエラー:', error);
      
      // フォールバック：デモ用の推定データを生成
      return this.generateFallbackEstimation(address, propertyData);
    }
  }
  
  /**
   * フォールバック：デモ用推定データ生成
   */
  private generateFallbackEstimation(
    address: string,
    propertyData: any
  ): PropertyPriceEstimation {
    console.log('⚠️ フォールバック：デモ用データを生成中...');
    
    // 基本価格計算（面積と築年数ベース）
    const basePrice = 800000; // 基本㎡単価
    const ageAdjustment = Math.max(0.5, 1 - (2024 - propertyData.buildingYear) * 0.02); // 築年数調整
    const areaPrice = propertyData.area * basePrice * ageAdjustment;
    
    // 立地による調整（駅距離）
    const stationAdjustment = Math.max(0.7, 1 - (propertyData.stationDistance - 5) * 0.03);
    const estimatedPrice = Math.round(areaPrice * stationAdjustment);
    
    // 価格レンジ（±15%）
    const priceRange = {
      min: Math.round(estimatedPrice * 0.85),
      max: Math.round(estimatedPrice * 1.15)
    };
    
    return {
      estimatedPrice,
      confidence: 0.6, // デモデータなので60%
      priceRange,
      comparableTransactions: [], // デモなので空
      factors: {
        location: (stationAdjustment - 1), // 駅距離による影響
        building: (ageAdjustment - 1),     // 築年数による影響
        market: 0.02                       // 市場トレンド（+2%）
      },
      methodology: [
        '⚠️ デモンストレーション用データ',
        'バックエンドAPI実装待ち',
        '面積・築年数・駅距離による簡易推定',
        '実際の取引データではありません'
      ]
    };
  }
}

// 使用例
export const mlitPriceService = new MLITPropertyPriceService();
