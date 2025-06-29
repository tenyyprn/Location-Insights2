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

// 信頼性分析の設定
interface CredibilityConfig {
  minReliabilityThreshold: number;
  requiredSourceCount: number;
  freshnessWeightDays: number;
  categoryWeights: {
    [category: string]: number;
  };
}

// 信頼性分析サービスクラス
export class CredibilityAnalysisService {
  private config: CredibilityConfig = {
    minReliabilityThreshold: 70,
    requiredSourceCount: 3,
    freshnessWeightDays: 365,
    categoryWeights: {
      '政府統計': 1.0,
      '公的機関': 0.9,
      '学術研究': 0.85,
      '業界団体': 0.75,
      '民間調査': 0.7,
      '口コミ': 0.4
    }
  };

  /**
   * データソースの信頼性を分析
   */
  public analyzeCredibility(dataSources: DataSource[]): CredibleAnalysisResult {
    if (!dataSources || dataSources.length === 0) {
      return this.createEmptyResult();
    }

    const reliabilityBreakdown = this.calculateCategoryReliability(dataSources);
    const overallReliability = this.calculateOverallReliability(dataSources);
    const qualityScore = this.calculateQualityScore(dataSources);
    const dataFreshness = this.calculateDataFreshness(dataSources);
    const crossValidation = this.checkCrossValidation(dataSources);

    return {
      dataSources: dataSources.sort((a, b) => b.reliability - a.reliability),
      overallReliability,
      qualityScore,
      sourceCount: dataSources.length,
      lastValidated: new Date().toISOString(),
      reliabilityBreakdown,
      dataFreshness,
      crossValidation,
      confidence: {
        overall: overallReliability,
        breakdown: {
          recency: this.calculateRecencyScore(dataSources),
          coverage: 80, // デフォルト値
          dataQuality: qualityScore
        }
      },
      recommendations: this.generateImprovementSuggestions({
        dataSources,
        overallReliability,
        qualityScore,
        sourceCount: dataSources.length,
        lastValidated: new Date().toISOString(),
        reliabilityBreakdown,
        dataFreshness,
        crossValidation,
        confidence: {
          overall: overallReliability,
          breakdown: {
            recency: this.calculateRecencyScore(dataSources),
            coverage: 80,
            dataQuality: qualityScore
          }
        },
        recommendations: [],
        limitations: []
      }),
      limitations: []
    };
  }

  /**
   * 分析結果に信頼性情報を付加
   */
  public enhanceWithCredibility(
    analysisData: any,
    address: string
  ): CredibleAnalysisResult {
    // 分析データに基づいてデータソースを推定
    const dataSources = this.inferDataSources(analysisData);
    
    // 信頼性分析を実行
    const result = this.analyzeCredibility(dataSources);
    
    // 地域に基づいた信頼性調整
    const adjustedResult = this.adjustCredibilityByLocation(result, address);
    
    return adjustedResult;
  }

  /**
   * 特定のカテゴリの信頼性を評価
   */
  public evaluateCategoryReliability(category: string, sources: DataSource[]): number {
    const categorySources = sources.filter(source => source.category === category);
    if (categorySources.length === 0) return 0;

    const weightedSum = categorySources.reduce((sum, source) => {
      const categoryWeight = this.config.categoryWeights[source.category] || 0.5;
      return sum + (source.reliability * categoryWeight);
    }, 0);

    return Math.min(100, weightedSum / categorySources.length);
  }

  /**
   * データソースの信頼性を個別に検証
   */
  public validateDataSource(source: DataSource): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 信頼性スコアチェック
    if (source.reliability < this.config.minReliabilityThreshold) {
      issues.push(`信頼性スコアが基準値(${this.config.minReliabilityThreshold}%)を下回っています`);
      recommendations.push('より信頼性の高いデータソースの追加を検討してください');
    }

    // データの新鮮さチェック
    const daysSinceUpdate = this.getDaysSinceUpdate(source.lastUpdated);
    if (daysSinceUpdate > this.config.freshnessWeightDays) {
      issues.push(`データが古すぎます（${daysSinceUpdate}日前）`);
      recommendations.push('最新のデータソースへの更新を検討してください');
    }

    // カテゴリ妥当性チェック
    if (!(source.category in this.config.categoryWeights)) {
      issues.push('不明なデータソースカテゴリです');
      recommendations.push('適切なカテゴリの設定を行ってください');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * 信頼性の向上提案を生成
   */
  public generateImprovementSuggestions(result: CredibleAnalysisResult): string[] {
    const suggestions: string[] = [];

    if (result.overallReliability < 80) {
      suggestions.push('より多くの信頼できるデータソースの追加を推奨します');
    }

    if (result.sourceCount < this.config.requiredSourceCount) {
      suggestions.push(`最低${this.config.requiredSourceCount}つのデータソースを確保することを推奨します`);
    }

    if (!result.crossValidation) {
      suggestions.push('複数のソース間でのクロスバリデーションを実施してください');
    }

    if (result.dataFreshness < 70) {
      suggestions.push('より新しいデータソースへの更新を検討してください');
    }

    // カテゴリ別の改善提案
    Object.entries(result.reliabilityBreakdown).forEach(([category, reliability]) => {
      if (reliability < 60) {
        suggestions.push(`${category}カテゴリのデータ品質向上が必要です`);
      }
    });

    return suggestions;
  }

  // Private methods

  private createEmptyResult(): CredibleAnalysisResult {
    return {
      dataSources: [],
      overallReliability: 0,
      qualityScore: 0,
      sourceCount: 0,
      lastValidated: new Date().toISOString(),
      reliabilityBreakdown: {},
      dataFreshness: 0,
      crossValidation: false,
      confidence: {
        overall: 0,
        breakdown: {
          recency: 0,
          coverage: 0,
          dataQuality: 0
        }
      },
      recommendations: [],
      limitations: []
    };
  }

  private calculateCategoryReliability(sources: DataSource[]): { [category: string]: number } {
    const breakdown: { [category: string]: number } = {};
    
    // カテゴリごとにグループ化
    const categoryGroups = sources.reduce((groups, source) => {
      if (!groups[source.category]) {
        groups[source.category] = [];
      }
      groups[source.category].push(source);
      return groups;
    }, {} as { [category: string]: DataSource[] });

    // 各カテゴリの信頼性を計算
    Object.entries(categoryGroups).forEach(([category, categorySources]) => {
      const avgReliability = categorySources.reduce((sum, source) => sum + source.reliability, 0) / categorySources.length;
      const categoryWeight = this.config.categoryWeights[category] || 0.5;
      breakdown[category] = Math.round(avgReliability * categoryWeight);
    });

    return breakdown;
  }

  private calculateOverallReliability(sources: DataSource[]): number {
    if (sources.length === 0) return 0;

    const weightedSum = sources.reduce((sum, source) => {
      const categoryWeight = this.config.categoryWeights[source.category] || 0.5;
      const freshnessWeight = this.calculateFreshnessWeight(source.lastUpdated);
      return sum + (source.reliability * categoryWeight * freshnessWeight);
    }, 0);

    const totalWeight = sources.reduce((sum, source) => {
      const categoryWeight = this.config.categoryWeights[source.category] || 0.5;
      const freshnessWeight = this.calculateFreshnessWeight(source.lastUpdated);
      return sum + (categoryWeight * freshnessWeight);
    }, 0);

    return Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);
  }

  private calculateQualityScore(sources: DataSource[]): number {
    if (sources.length === 0) return 0;

    let qualitySum = 0;
    let factorCount = 0;

    // ソース数による評価
    qualitySum += Math.min(100, (sources.length / this.config.requiredSourceCount) * 30);
    factorCount += 30;

    // 平均信頼性による評価
    const avgReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
    qualitySum += avgReliability * 0.5;
    factorCount += 50;

    // データの新鮮さによる評価
    const avgFreshness = this.calculateDataFreshness(sources);
    qualitySum += avgFreshness * 0.2;
    factorCount += 20;

    return Math.round(qualitySum / factorCount * 100);
  }

  private calculateDataFreshness(sources: DataSource[]): number {
    if (sources.length === 0) return 0;

    const freshnessScores = sources.map(source => {
      const daysSinceUpdate = this.getDaysSinceUpdate(source.lastUpdated);
      return Math.max(0, 100 - (daysSinceUpdate / this.config.freshnessWeightDays) * 100);
    });

    return Math.round(freshnessScores.reduce((sum, score) => sum + score, 0) / freshnessScores.length);
  }

  private checkCrossValidation(sources: DataSource[]): boolean {
    // 異なるカテゴリのソースが複数ある場合にクロスバリデーション可能と判定
    const categories = new Set(sources.map(s => s.category));
    return categories.size >= 2 && sources.length >= 3;
  }

  private calculateFreshnessWeight(lastUpdated: string): number {
    const daysSinceUpdate = this.getDaysSinceUpdate(lastUpdated);
    return Math.max(0.3, 1 - (daysSinceUpdate / this.config.freshnessWeightDays));
  }

  private getDaysSinceUpdate(lastUpdated: string): number {
    try {
      const updateDate = new Date(lastUpdated);
      const now = new Date();
      return Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return this.config.freshnessWeightDays; // パース失敗時は最大日数を返す
    }
  }

  /**
   * 分析データからデータソースを推定
   */
  private inferDataSources(analysisData: any): DataSource[] {
    const sources: DataSource[] = [];
    
    // 政府データの使用を確認
    if (analysisData.usesGovernmentData) {
      sources.push({
        name: 'e-Stat 政府統計ポータル',
        reliability: 95,
        category: '政府統計',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // RESASデータの使用を確認
    if (analysisData.usesEstatData) {
      sources.push({
        name: 'RESAS 地域経済分析システム',
        reliability: 90,
        category: '公的機関',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Google Mapsデータの使用を確認
    if (analysisData.usesGoogleMaps) {
      sources.push({
        name: 'Google Maps Platform',
        reliability: 85,
        category: '民間調査',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // 不動産データの使用を確認
    if (analysisData.usesRealEstateData) {
      sources.push({
        name: '国土交通省 不動産取引価格情報',
        reliability: 88,
        category: '政府統計',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // リアルタイムデータの使用を確認
    if (analysisData.usesRealTimeData) {
      sources.push({
        name: 'リアルタイムAPIデータ',
        reliability: 80,
        category: '民間調査',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // デフォルトソースを追加（ソースがない場合）
    if (sources.length === 0) {
      sources.push({
        name: '統合データベース',
        reliability: 70,
        category: '民間調査',
        lastUpdated: new Date().toISOString()
      });
    }
    
    return sources;
  }

  /**
   * 地域に基づいた信頼性調整
   */
  private adjustCredibilityByLocation(
    result: CredibleAnalysisResult,
    address: string
  ): CredibleAnalysisResult {
    const adjustedResult = { ...result };
    
    // 都市部か地方かで信頼性を調整
    const isUrbanArea = this.isUrbanArea(address);
    
    if (!isUrbanArea) {
      // 地方部の場合、データの精度が低い可能性がある
      adjustedResult.overallReliability = Math.max(50, result.overallReliability - 10);
      adjustedResult.qualityScore = Math.max(50, result.qualityScore - 5);
      
      // 制限事項を追加
      adjustedResult.limitations = [
        ...result.limitations,
        '地方部のため、一部データの精度が制限される可能性があります'
      ];
      
      // 推奨事項を追加
      adjustedResult.recommendations = [
        ...result.recommendations,
        '現地調査や地元情報の収集を推奨します'
      ];
    }
    
    // 信頼度の詳細情報を追加
    adjustedResult.confidence = {
      overall: adjustedResult.overallReliability,
      breakdown: {
        recency: this.calculateRecencyScore(result.dataSources),
        coverage: this.calculateCoverageScore(result.dataSources, address),
        dataQuality: this.calculateDataQualityScore(result.dataSources)
      }
    };
    
    return adjustedResult;
  }

  /**
   * 都市部かどうかを判定
   */
  private isUrbanArea(address: string): boolean {
    const urbanKeywords = ['東京', '大阪', '名古屋', '横浜', '神戸', '京都', '福岡', '札幌', '仙台'];
    return urbanKeywords.some(keyword => address.includes(keyword));
  }

  /**
   * 最新性スコアを計算
   */
  private calculateRecencyScore(sources: DataSource[]): number {
    if (sources.length === 0) return 0;
    
    const avgFreshness = sources.reduce((sum, source) => {
      const daysSinceUpdate = this.getDaysSinceUpdate(source.lastUpdated);
      return sum + Math.max(0, 100 - (daysSinceUpdate / 365) * 100);
    }, 0) / sources.length;
    
    return Math.round(avgFreshness);
  }

  /**
   * カバレッジスコアを計算
   */
  private calculateCoverageScore(sources: DataSource[], address: string): number {
    const requiredCategories = ['政府統計', '公的機関', '民間調査'];
    const availableCategories = new Set(sources.map(s => s.category));
    
    const coverageRatio = Array.from(availableCategories).filter(cat => 
      requiredCategories.includes(cat)
    ).length / requiredCategories.length;
    
    let score = coverageRatio * 100;
    
    // 地方部の場合はカバレッジが低い可能性
    if (!this.isUrbanArea(address)) {
      score = Math.max(40, score - 20);
    }
    
    return Math.round(score);
  }

  /**
   * データ品質スコアを計算
   */
  private calculateDataQualityScore(sources: DataSource[]): number {
    if (sources.length === 0) return 0;
    
    const avgReliability = sources.reduce((sum, source) => sum + source.reliability, 0) / sources.length;
    return Math.round(avgReliability);
  }
}

// サービスインスタンスのエクスポート
export const credibilityService = new CredibilityAnalysisService();

// デフォルトエクスポート
export default CredibilityAnalysisService;
