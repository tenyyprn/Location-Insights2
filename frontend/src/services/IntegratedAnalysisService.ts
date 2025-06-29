// IntegratedAnalysisService.ts - 一貫性チェッカー統合版

import { consistencyChecker } from './ConsistencyChecker';
import { credibilityService } from './CredibilityAnalysisService';
import { apiService } from './apiService';
import { 
  EnhancedAnalysisResult, 
  ConsistentAnalysisResult, 
  CredibleAnalysisResult,
  FinalAnalysisResult 
} from '../types';

// EnhancedAnalysisResult型は../typesからインポート

export class IntegratedAnalysisService {
  
  /**
   * 完全統合分析の実行
   */
  async performIntegratedAnalysis(
    address: string,
    coordinates?: { lat: number; lng: number }
  ): Promise<EnhancedAnalysisResult> {
    
    console.log('🚀 統合分析開始:', address);
    
    try {
      // 1. 基本分析の実行
      const originalAnalysis = await this.performBaseAnalysis(address, coordinates);
      console.log('✅ 基本分析完了');
      
      // 2. 一貫性チェックの実行
      const consistentAnalysis = consistencyChecker.checkAndCorrectAnalysis(originalAnalysis);
      console.log('✅ 一貫性チェック完了:', consistentAnalysis.qualityScore + '%');
      
      // 3. 信憑性分析の実行
      const credibilityAnalysis = credibilityService.enhanceWithCredibility(
        {
          ...consistentAnalysis.corrected,
          usesGovernmentData: true,
          usesEstatData: true,
          usesGoogleMaps: true,
          usesRealEstateData: true,
          usesMultipleSources: true,
          usesRealTimeData: true,
          isRuralArea: this.isRuralArea(address)
        },
        address
      );
      console.log('✅ 信憑性分析完了:', credibilityAnalysis.confidence.overall + '%');
      
      // 4. 最終結果の統合
      const finalResult = this.integrateResults(
        consistentAnalysis.corrected,
        credibilityAnalysis,
        consistentAnalysis
      );
      console.log('✅ 結果統合完了');
      
      return {
        originalAnalysis,
        consistentAnalysis,
        credibilityAnalysis,
        finalResult
      };
      
    } catch (error) {
      console.error('❌ 統合分析エラー:', error);
      // errorの型を適切にキャスト
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`統合分析に失敗しました: ${errorMessage}`);
    }
  }

  /**
   * 基本分析の実行
   */
  private async performBaseAnalysis(
    address: string, 
    coordinates?: { lat: number; lng: number }
  ): Promise<any> {
    
    const analysisRequest = {
      address,
      coordinates: coordinates || await this.geocodeAddress(address),
      analysisOptions: {
        includeTransport: true,
        includeCommercial: true,
        includeMedical: true,
        includeEducation: true,
        includeSafety: true,
        includeEnvironment: true,
        useGovernmentData: true,
        useEstatData: true,
        useGoogleMaps: true,
        useRealEstateData: true,
        enableDetailedAnalysis: true,
        enableFuturePrediction: true,
        enableSWOTAnalysis: true,
        enableMarketAnalysis: true
      }
    };

    return await apiService.analyzeLifestyleScore(analysisRequest);
  }

  /**
   * 結果の統合
   */
  private integrateResults(
    correctedAnalysis: any,
    credibilityAnalysis: CredibleAnalysisResult,
    consistencyResult: ConsistentAnalysisResult
  ): FinalAnalysisResult {
    
    return {
      lifestyleScore: this.integrateLifestyleScores(correctedAnalysis, credibilityAnalysis),
      detailedAnalysis: this.integrateDetailedAnalysis(correctedAnalysis, credibilityAnalysis),
      futurePredict: this.integrateFuturePredictions(correctedAnalysis, credibilityAnalysis),
      swotAnalysis: this.integrateSWOTAnalysis(correctedAnalysis, credibilityAnalysis),
      qualityMetrics: this.generateQualityMetrics(credibilityAnalysis, consistencyResult)
    };
  }

  /**
   * ライフスタイルスコアの統合
   */
  private integrateLifestyleScores(
    analysis: any,
    credibility: CredibleAnalysisResult
  ): Record<string, number> {
    
    const baseScores = analysis.lifestyleScore || {};
    const adjustedScores: Record<string, number> = {};
    
    // 信頼度に基づくスコア調整
    Object.entries(baseScores).forEach(([category, score]) => {
      if (typeof score === 'number') {
        adjustedScores[category] = this.adjustScoreByConfidence(
          score, 
          credibility.confidence.overall,
          category
        );
      }
    });
    
    return adjustedScores;
  }

  /**
   * 詳細分析の統合
   */
  private integrateDetailedAnalysis(
    analysis: any,
    credibility: CredibleAnalysisResult
  ): FinalAnalysisResult['detailedAnalysis'] {
    
    const base = analysis.detailedAnalysis || {};
    
    return {
      strengths: this.enhanceStrengths(base.strengths || [], credibility),
      weaknesses: this.enhanceWeaknesses(base.weaknesses || [], credibility),
      improvements: this.generateImprovements(base, credibility),
      recommendations: this.generateRecommendations(base, credibility)
    };
  }

  /**
   * 強みの強化
   */
  private enhanceStrengths(
    originalStrengths: string[],
    credibility: CredibleAnalysisResult
  ): string[] {
    
    return originalStrengths.map(strength => {
      const score = this.extractScore(strength);
      const category = this.extractCategory(strength);
      
      if (score !== null && score >= 65) {
        const dataSource = this.getDataSourceForCategory(category, credibility);
        const confidenceText = this.getConfidenceText(credibility.confidence.overall);
        
        return `${category}${this.formatScore(score)}点 (${this.getScoreLabel(score)}) - ${this.generatePositiveDescription(score, category)} ${confidenceText}`;
      }
      
      return strength;
    }).filter(strength => {
      // 65点未満の項目は強みから除外
      const score = this.extractScore(strength);
      return score === null || score >= 65;
    });
  }

  /**
   * 弱みの強化
   */
  private enhanceWeaknesses(
    originalWeaknesses: string[],
    credibility: CredibleAnalysisResult
  ): string[] {
    
    const enhanced = originalWeaknesses.map(weakness => {
      const score = this.extractScore(weakness);
      const category = this.extractCategory(weakness);
      
      if (score !== null && score < 65) {
        const improvementSuggestion = this.generateImprovementSuggestion(score, category);
        
        return `${category}${this.formatScore(score)}点 (${this.getScoreLabel(score)}) - ${this.generateNegativeDescription(score, category)}
        💡 改善提案: ${improvementSuggestion}`;
      }
      
      return weakness;
    });
    
    // 追加の弱み検出
    const additionalWeaknesses = this.detectAdditionalWeaknesses(credibility);
    
    return [...enhanced, ...additionalWeaknesses];
  }

  /**
   * 将来予測の統合
   */
  private integrateFuturePredictions(
    analysis: any,
    credibility: CredibleAnalysisResult
  ): FinalAnalysisResult['futurePredict'] {
    
    const base = analysis.futurePredict || {};
    
    // 信頼度に基づく予測信頼度の計算
    const baseConfidence = credibility.confidence.overall;
    const confidenceLevels = {
      oneYear: Math.min(90, baseConfidence + 10),
      threeYears: Math.max(40, baseConfidence - 10),
      fiveYears: Math.max(20, baseConfidence - 30)
    };
    
    return {
      oneYear: this.enhancePrediction(base.oneYear, confidenceLevels.oneYear, '1年後'),
      threeYears: this.enhancePrediction(base.threeYears || base.fiveYears, confidenceLevels.threeYears, '3年後'),
      fiveYears: this.enhancePrediction(base.fiveYears, confidenceLevels.fiveYears, '5年後'),
      confidenceLevels
    };
  }

  /**
   * SWOT分析の統合
   */
  private integrateSWOTAnalysis(
    analysis: any,
    credibility: CredibleAnalysisResult
  ): FinalAnalysisResult['swotAnalysis'] {
    
    const base = analysis.swotAnalysis || {};
    
    return {
      strengths: this.validateSWOTItems(base.strengths || [], 'strengths', credibility),
      weaknesses: this.validateSWOTItems(base.weaknesses || [], 'weaknesses', credibility),
      opportunities: this.enhanceSWOTOpportunities(base.opportunities || [], credibility),
      threats: this.enhanceSWOTThreats(base.threats || [], credibility),
      strategicRecommendations: this.generateStrategicRecommendations(base, credibility)
    };
  }

  /**
   * 品質メトリクスの生成
   */
  private generateQualityMetrics(
    credibility: CredibleAnalysisResult,
    consistency: ConsistentAnalysisResult
  ): FinalAnalysisResult['qualityMetrics'] {
    
    const overallQuality = Math.round(
      (credibility.confidence.overall * 0.6) +
      (consistency.qualityScore * 0.4)
    );
    
    return {
      consistencyScore: consistency.qualityScore,
      credibilityScore: credibility.confidence.overall,
      overallQuality,
      improvements: [
        ...consistency.improvements,
        ...credibility.recommendations
      ],
      limitations: credibility.limitations
    };
  }

  /**
   * 信頼度によるスコア調整
   */
  private adjustScoreByConfidence(
    score: number, 
    confidence: number, 
    category: string
  ): number {
    
    if (confidence < 50) {
      // 低信頼度の場合、10点刻みに丸める
      return Math.round(score / 10) * 10;
    } else if (confidence < 70) {
      // 中信頼度の場合、5点刻みに丸める
      return Math.round(score / 5) * 5;
    }
    
    // 高信頼度の場合、1点刻みのまま
    return Math.round(score);
  }

  /**
   * スコアラベルの取得
   */
  private getScoreLabel(score: number): string {
    if (score >= 85) return "優秀";
    if (score >= 75) return "良好";
    if (score >= 65) return "標準的";
    if (score >= 55) return "やや不足";
    if (score >= 45) return "不足";
    return "大幅不足";
  }

  /**
   * ポジティブな説明文生成
   */
  private generatePositiveDescription(score: number, category: string): string {
    const templates = {
      85: "非常に充実しており、高い満足度が期待できます",
      75: "十分に整備されており、快適に利用できます",
      65: "基本的なニーズは満たしており、問題なく利用可能です"
    };
    
    const threshold = score >= 85 ? 85 : score >= 75 ? 75 : 65;
    return templates[threshold];
  }

  /**
   * ネガティブな説明文生成
   */
  private generateNegativeDescription(score: number, category: string): string {
    const templates = {
      55: "やや不足気味ですが、工夫次第で利用可能です",
      45: "制約があり、代替手段の検討が必要です",
      35: "大幅に不足しており、重要な課題となります"
    };
    
    const threshold = score >= 55 ? 55 : score >= 45 ? 45 : 35;
    return templates[threshold];
  }

  /**
   * 改善提案の生成
   */
  private generateImprovementSuggestion(score: number, category: string): string {
    // 提案の型を明示的に定義
    interface Suggestions {
      [category: string]: {
        [score: number]: string;
      };
    }
    
    const suggestions: Suggestions = {
      '交通': {
        55: '近隣の交通手段を調査し、最適なルートを見つけることを推奨',
        45: '自家用車の利用や、駅近エリアでの住居検討を推奨',
        35: '交通利便性を重視する場合は、他の地域を検討することを推奨'
      },
      '買い物': {
        55: 'オンラインショッピングの活用や、まとめ買いでの効率化を推奨',
        45: '週末の計画的な買い物や、配送サービスの利用を推奨',
        35: '近隣都市部での買い物計画や、ネット通販の積極活用を推奨'
      },
      '医療': {
        55: '予防医療の充実や、定期健診の計画的な実施を推奨',
        45: '近隣の医療機関情報の事前調査と、緊急時の対応計画を推奨',
        35: '総合病院への アクセス手段の確保と、医療保険の充実を推奨'
      }
    };
    
    const categoryKey = Object.keys(suggestions).find(key => category.includes(key)) || '買い物';
    const scoreKey = score >= 55 ? 55 : score >= 45 ? 45 : 35;
    
    // 型安全なアクセス
    const categoryData = suggestions[categoryKey];
    if (categoryData && categoryData[scoreKey]) {
      return categoryData[scoreKey];
    }
    
    return '地域の特性を理解した上での生活設計を推奨';
  }

  /**
   * 信頼度テキストの生成
   */
  private getConfidenceText(confidence: number): string {
    if (confidence >= 80) return "(高信頼度データに基づく)";
    if (confidence >= 60) return "(中程度信頼度データに基づく)";
    return "(限定的データに基づく、要現地確認)";
  }

  /**
   * 予測の強化
   */
  private enhancePrediction(
    prediction: string, 
    confidence: number, 
    timeframe: string
  ): string {
    if (!prediction) {
      return `${timeframe}の予測データが不足しています。現地情報の収集を推奨します。`;
    }
    
    const confidenceText = confidence >= 70 ? "高い確度で" : 
                          confidence >= 50 ? "一定の確度で" : "限定的な情報から";
    
    return `${prediction} (${confidenceText}予測, 信頼度: ${confidence}%)`;
  }

  /**
   * ユーティリティメソッド
   */
  private extractScore(text: string): number | null {
    const match = text.match(/(\d+(?:\.\d+)?)点/);
    return match ? parseFloat(match[1]) : null;
  }

  private extractCategory(text: string): string {
    const categories = ['交通', 'アクセス', '買い物', '商業', '医療', '教育', '環境', '安全', '経済'];
    return categories.find(cat => text.includes(cat)) || 'その他';
  }

  private formatScore(score: number): string {
    const rounded = Math.round(score * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  }

  private isRuralArea(address: string): boolean {
    const urbanKeywords = ['東京', '大阪', '名古屋', '横浜', '神戸', '京都', '福岡', '札幌', '仙台'];
    return !urbanKeywords.some(keyword => address.includes(keyword));
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    // デフォルト座標（実際の実装では Google Maps Geocoding API を使用）
    return { lat: 35.6581, lng: 139.7414 };
  }

  private getDataSourceForCategory(category: string, credibility: CredibleAnalysisResult): string {
    // 型を明示的に指定
    interface DataSource {
      name: string;
      reliability: number;
    }
    
    const relevantSources = credibility.dataSources
      .filter((source: DataSource) => source.reliability >= 80)
      .map((source: DataSource) => source.name);
    
    return relevantSources.length > 0 ? 
      `(${relevantSources[0]}データ)` : 
      '(推定値)';
  }

  private detectAdditionalWeaknesses(credibility: CredibleAnalysisResult): string[] {
    const weaknesses: string[] = [];
    
    if (credibility.confidence.breakdown.recency < 70) {
      weaknesses.push('データの一部が古く、最新状況との差異の可能性があります');
    }
    
    if (credibility.confidence.breakdown.coverage < 60) {
      weaknesses.push('一部の分析項目でデータが不足しており、精度に限界があります');
    }
    
    return weaknesses;
  }

  private validateSWOTItems(
    items: string[], 
    type: 'strengths' | 'weaknesses', 
    credibility: CredibleAnalysisResult
  ): string[] {
    
    return items.map(item => {
      const confidence = credibility.confidence.overall;
      
      if (confidence < 60) {
        return `${item} (要現地確認)`;
      } else if (confidence < 80) {
        return `${item} (中程度の確度)`;
      }
      
      return item;
    });
  }

  private enhanceSWOTOpportunities(opportunities: string[], credibility: CredibleAnalysisResult): string[] {
    const enhanced = [...opportunities];
    
    // データ品質に基づく機会の追加
    if (credibility.confidence.breakdown.dataQuality >= 80) {
      enhanced.push('高品質なデータに基づく戦略的意思決定が可能');
    }
    
    return enhanced;
  }

  private enhanceSWOTThreats(threats: string[], credibility: CredibleAnalysisResult): string[] {
    const enhanced = [...threats];
    
    // データの制限に基づく脅威の追加
    if (credibility.confidence.overall < 70) {
      enhanced.push('データの不確実性による判断リスク');
    }
    
    return enhanced;
  }

  private generateStrategicRecommendations(base: any, credibility: CredibleAnalysisResult): string[] {
    const recommendations = base.strategicRecommendations || [];
    
    // 信頼度に基づく推奨事項を追加
    if (credibility.confidence.overall >= 80) {
      recommendations.push('高信頼度データを活用した長期計画の策定');
    } else {
      recommendations.push('現地調査による情報補完と段階的な意思決定');
    }
    
    return recommendations;
  }

  private generateImprovements(base: any, credibility: CredibleAnalysisResult): string[] {
    const improvements: string[] = [];
    
    // 低スコア項目の改善提案
    if (base.lifestyleScore) {
      Object.entries(base.lifestyleScore).forEach(([category, score]) => {
        if (typeof score === 'number' && score < 60) {
          improvements.push(this.generateImprovementSuggestion(score, category));
        }
      });
    }
    
    return improvements;
  }

  private generateRecommendations(base: any, credibility: CredibleAnalysisResult): string[] {
    const recommendations = [
      '実際の住環境選択時は、現地見学を強く推奨します',
      '個人の価値観・ライフスタイルに合わせた重み付けを検討してください'
    ];
    
    if (credibility.confidence.overall < 70) {
      recommendations.push('追加の情報収集と複数の意見を参考にすることを推奨します');
    }
    
    return recommendations;
  }
}

// シングルトンインスタンス
export const integratedAnalysisService = new IntegratedAnalysisService();