/**
 * 国土数値情報（将来推計人口250mメッシュ）API サービス
 */

export interface PopulationData {
  MESH_ID: string;
  SHICODE: string;
  [key: string]: string | number; // 動的な年度データ対応
}

export interface PopulationFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: PopulationData;
}

export interface PopulationResponse {
  type: string;
  features: PopulationFeature[];
}

export interface TileCoordinate {
  x: number;
  y: number;
  z: number;
}

export class PopulationApiService {
  private readonly baseUrl = 'https://www.reinfolib.mlit.go.jp/ex-api/external/XKT013';

  /**
   * 緯度経度からタイル座標を計算
   */
  public latLngToTile(lat: number, lng: number, zoom: number): TileCoordinate {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    return { x, y, z: zoom };
  }

  /**
   * タイル座標から緯度経度を計算
   */
  public tileToLatLng(x: number, y: number, zoom: number): { lat: number, lng: number } {
    const lng = x / Math.pow(2, zoom) * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    
    return { lat, lng };
  }

  /**
   * 将来推計人口データを取得
   */
  public async getPopulationData(
    x: number,
    y: number,
    z: number,
    responseFormat: 'geojson' | 'pbf' = 'geojson'
  ): Promise<PopulationResponse> {
    // ズームレベルの範囲チェック
    if (z < 11 || z > 15) {
      throw new Error('ズームレベルは11～15の範囲で指定してください');
    }

    const params = new URLSearchParams({
      response_format: responseFormat,
      z: z.toString(),
      x: x.toString(),
      y: y.toString()
    });

    const url = `${this.baseUrl}?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      return data as PopulationResponse;
    } catch (error) {
      console.error('人口データ取得エラー:', error);
      throw error;
    }
  }

  /**
   * 複数のタイルの人口データを一括取得
   */
  public async getBulkPopulationData(
    tiles: TileCoordinate[],
    responseFormat: 'geojson' | 'pbf' = 'geojson'
  ): Promise<PopulationResponse[]> {
    const promises = tiles.map(tile => 
      this.getPopulationData(tile.x, tile.y, tile.z, responseFormat)
        .catch(error => {
          console.warn(`タイル ${tile.x},${tile.y},${tile.z} の取得に失敗:`, error);
          return null;
        })
    );

    const results = await Promise.all(promises);
    return results.filter(result => result !== null) as PopulationResponse[];
  }

  /**
   * 指定された地域の人口データを年度別に取得
   */
  public async getPopulationDataByRegion(
    centerLat: number,
    centerLng: number,
    radius: number = 1, // km
    zoom: number = 13
  ): Promise<PopulationResponse[]> {
    // 中心点から半径内のタイル座標を計算
    const centerTile = this.latLngToTile(centerLat, centerLng, zoom);
    const tiles: TileCoordinate[] = [];

    // 簡易的に周辺のタイルを取得（実際にはより精密な計算が必要）
    const tileRange = Math.ceil(radius / 0.5); // 大まかな計算
    
    for (let dx = -tileRange; dx <= tileRange; dx++) {
      for (let dy = -tileRange; dy <= tileRange; dy++) {
        tiles.push({
          x: centerTile.x + dx,
          y: centerTile.y + dy,
          z: zoom
        });
      }
    }

    return this.getBulkPopulationData(tiles);
  }

  /**
   * 人口データから統計情報を計算
   */
  public calculatePopulationStats(data: PopulationResponse[]): {
    totalPopulation: number;
    ageGroups: { [key: string]: number };
    populationDensity: number;
    trends: { year: string; population: number }[];
  } {
    let totalPopulation = 0;
    const ageGroups: { [key: string]: number } = {
      '0-14': 0,
      '15-64': 0,
      '65+': 0,
      '75+': 0,
      '80+': 0
    };
    const yearlyData: { [key: string]: number } = {};

    data.forEach(response => {
      response.features.forEach(feature => {
        const props = feature.properties;
        
        // 年度別総人口を集計
        Object.keys(props).forEach(key => {
          if (key.match(/^PT00_20\d{2}$/)) {
            const year = key.substring(5);
            const population = Number(props[key]) || 0;
            yearlyData[year] = (yearlyData[year] || 0) + population;
          }
        });

        // 最新年度の年齢別人口を集計（仮に2050年とする）
        if (props.PTA_2050) ageGroups['0-14'] += Number(props.PTA_2050) || 0;
        if (props.PTB_2050) ageGroups['15-64'] += Number(props.PTB_2050) || 0;
        if (props.PTC_2050) ageGroups['65+'] += Number(props.PTC_2050) || 0;
        if (props.PTD_2050) ageGroups['75+'] += Number(props.PTD_2050) || 0;
        if (props.PTE_2050) ageGroups['80+'] += Number(props.PTE_2050) || 0;
      });
    });

    // トレンドデータの作成
    const trends = Object.keys(yearlyData)
      .sort()
      .map(year => ({
        year,
        population: yearlyData[year]
      }));

    totalPopulation = trends.length > 0 ? trends[trends.length - 1].population : 0;

    return {
      totalPopulation,
      ageGroups,
      populationDensity: totalPopulation / (data.length * 0.0625), // 250mメッシュ = 0.0625km²
      trends
    };
  }
}

export const populationApiService = new PopulationApiService();