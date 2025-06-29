// ConsistencyChecker.ts - 一貫性チェッカーサービス

import { Contradiction, ConsistentAnalysisResult, ValidationResult } from '../types';

export interface ScoreThreshold {
  min: number;
  max: number;
  label: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
}

export class ConsistencyChecker {
  
  private readonly SCORE_THRESHOLDS: ScoreThreshold[] = [
    {
      min: 85, max: 100,
      label: "優秀",
      sentiment: "positive",
      keywords: ["優秀", "素晴らしい", "最高", "完璧", "理想的", "抜群"]
    },
    {
      min: 75, max: 84,
      label: "良好",
      sentiment: "positive", 
      keywords: ["良好", "良い", "快適", "十分", "満足", "充実"]
    },
    {
      min: 65, max: 74,
      label: "標準的",
      sentiment: "neutral",
      keywords: ["標準的", "普通", "一般的", "平均的", "基本的", "問題なし"]
    },
    {
      min: 55, max: 64,
      label: "やや不足",
      sentiment: "neutral",
      keywords: ["やや不足", "やや劣る", "改善余地", "工夫が必要", "限定的"]
    },
    {
      min: 45, max: 54,
      label: "不足",
      sentiment: "negative",
      keywords: ["不足", "劣る", "制約", "課題", "困難", "厳しい"]
    },
    {
      min: 0, max: 44,
      label: "大幅不足",
      sentiment: "negative",
      keywords: ["大幅不足", "深刻", "問題", "不適切", "避けるべき", "危険"]
    }
  ];

  /**
   * 検証結果の生成
   */
  private generateValidationResults(contradictions: Contradiction[]): ValidationResult[] {
    const categories = ['交通', '買い物', '医療', '教育', '環境', '安全'];
    
    return categories.map(category => {
      const categoryContradictions = contradictions.filter(c => 
        c.description.includes(category)
      );
      
      const issues = categoryContradictions.map(c => c.description);
      const passed = categoryContradictions.length === 0;
      const score = passed ? 100 : Math.max(0, 100 - (categoryContradictions.length * 20));
      
      const recommendations = categoryContradictions.length > 0 ? [
        `${category}に関する${categoryContradictions.length}件の問題を修正しました`,
        '詳細な現地調査を推奨します'
      ] : ['問題は検出されませんでした'];
      
      return {
        category,
        passed,
        score,
        issues,
        recommendations
      };
    });
  }

  /**
   * 分析結果の一貫性をチェックし、矛盾を修正
   */
  public checkAndCorrectAnalysis(analysisResult: any): ConsistentAnalysisResult {
    const contradictions: Contradiction[] = [];
    const corrected = JSON.parse(JSON.stringify(analysisResult)); // Deep copy

    // 1. スコアの数値精度チェック
    const numericalIssues = this.checkNumericalPrecision(corrected);
    contradictions.push(...numericalIssues);

    // 2. スコア-コメント一貫性チェック
    const consistencyIssues = this.checkScoreCommentConsistency(corrected);
    contradictions.push(...consistencyIssues);

    // 3. 論理的一貫性チェック
    const logicalIssues = this.checkLogicalConsistency(corrected);
    contradictions.push(...logicalIssues);

    // 4. 評価基準違反チェック
    const thresholdIssues = this.checkThresholdViolations(corrected);
    contradictions.push(...thresholdIssues);

    // 5. 修正の適用
    this.applyCorrections(corrected, contradictions);

    // 6. 品質スコア計算
    const qualityScore = this.calculateQualityScore(contradictions);

    // 7. 改善提案生成
    const improvements = this.generateImprovements(contradictions);

    return {
      original: analysisResult,
      corrected,
      contradictions,
      qualityScore,
      improvements,
      validationResults: this.generateValidationResults(contradictions)
    };
  }

  /**
   * 数値精度のチェック
   */
  private checkNumericalPrecision(analysis: any): Contradiction[] {
    const issues: Contradiction[] = [];

    const checkScore = (score: any, path: string) => {
      if (typeof score === 'number') {
        // 浮動小数点エラーの検出
        const hasFloatingPointError = score.toString().includes('000000') || 
                                    score.toString().length > 10;
        
        if (hasFloatingPointError) {
          const corrected = Math.round(score * 10) / 10;
          issues.push({
            type: 'numerical-precision',
            severity: 'medium',
            description: `${path}で浮動小数点エラーを検出`,
            original: score,
            suggested: corrected,
            confidence: 95
          });
        }

        // 不適切な精度の検出
        if (score % 1 !== 0 && score.toString().split('.')[1]?.length > 1) {
          const corrected = Math.round(score);
          issues.push({
            type: 'numerical-precision',
            severity: 'low',
            description: `${path}で不必要な小数点精度を検出`,
            original: score,
            suggested: corrected,
            confidence: 90
          });
        }
      }
    };

    // ライフスタイルスコアをチェック
    if (analysis.lifestyleScore) {
      Object.entries(analysis.lifestyleScore).forEach(([key, value]) => {
        checkScore(value, `lifestyleScore.${key}`);
      });
    }

    // その他のスコアフィールドをチェック
    this.traverseObject(analysis, checkScore);

    return issues;
  }

  /**
   * スコアとコメントの一貫性チェック
   */
  private checkScoreCommentConsistency(analysis: any): Contradiction[] {
    const issues: Contradiction[] = [];

    // 強み・弱みの分析
    if (analysis.detailedAnalysis?.strengths) {
      analysis.detailedAnalysis.strengths.forEach((strength: string, index: number) => {
        const scoreMatch = strength.match(/(\d+(?:\.\d+)?)点/);
        if (scoreMatch) {
          const score = parseFloat(scoreMatch[1]);
          const sentiment = this.analyzeSentiment(strength);
          const expectedSentiment = this.getExpectedSentiment(score);
          
          if (sentiment !== expectedSentiment && expectedSentiment !== 'neutral') {
            issues.push({
              type: 'score-comment-mismatch',
              severity: 'high',
              description: `強みで${score}点なのに${sentiment === 'negative' ? 'ネガティブ' : 'ポジティブ'}な表現`,
              original: strength,
              suggested: this.generateConsistentComment(score, this.extractCategory(strength), 'strength'),
              confidence: 85
            });
          }
        }
      });
    }

    return issues;
  }

  /**
   * 論理的一貫性チェック
   */
  private checkLogicalConsistency(analysis: any): Contradiction[] {
    const issues: Contradiction[] = [];

    // 強み・弱みの論理チェック
    if (analysis.detailedAnalysis) {
      const { strengths, weaknesses } = analysis.detailedAnalysis;
      
      if (strengths && weaknesses) {
        // 同じカテゴリが強みと弱みの両方に含まれていないかチェック
        strengths.forEach((strength: string, sIndex: number) => {
          const strengthCategory = this.extractCategory(strength);
          
          weaknesses.forEach((weakness: string, wIndex: number) => {
            const weaknessCategory = this.extractCategory(weakness);
            
            if (strengthCategory === weaknessCategory) {
              issues.push({
                type: 'logical-inconsistency',
                severity: 'critical',
                description: `${strengthCategory}が強みと弱みの両方に含まれています`,
                original: { strength, weakness },
                suggested: this.resolveContradictoryCategories(strength, weakness),
                confidence: 90
              });
            }
          });
        });
      }
    }

    return issues;
  }

  /**
   * 評価基準違反チェック
   */
  private checkThresholdViolations(analysis: any): Contradiction[] {
    const issues: Contradiction[] = [];

    if (analysis.lifestyleScore) {
      Object.entries(analysis.lifestyleScore).forEach(([category, score]) => {
        if (typeof score === 'number') {
          const threshold = this.getThresholdForScore(score);
          
          // 関連するコメントを検索
          const relatedComments = this.findRelatedComments(analysis, category);
          
          relatedComments.forEach(comment => {
            const commentSentiment = this.analyzeSentiment(comment);
            
            if (threshold.sentiment !== commentSentiment && threshold.sentiment !== 'neutral') {
              issues.push({
                type: 'threshold-violation',
                severity: 'high',
                description: `${category}のスコア${score}(${threshold.label})とコメントの感情が不一致`,
                original: comment,
                suggested: this.generateConsistentComment(score, category, 'general'),
                confidence: 80
              });
            }
          });
        }
      });
    }

    return issues;
  }

  /**
   * 修正の適用
   */
  private applyCorrections(analysis: any, contradictions: Contradiction[]): void {
    contradictions.forEach(contradiction => {
      if (contradiction.confidence >= 85) {
        // 高信頼度の修正のみ自動適用
        switch (contradiction.type) {
          case 'numerical-precision':
            this.applyNumericalCorrection(analysis, contradiction);
            break;
          case 'score-comment-mismatch':
            this.applyCommentCorrection(analysis, contradiction);
            break;
        }
      }
    });
  }

  /**
   * 数値修正の適用
   */
  private applyNumericalCorrection(analysis: any, contradiction: Contradiction): void {
    this.traverseObject(analysis, (value: any, path: string) => {
      if (value === contradiction.original) {
        this.setNestedProperty(analysis, path, contradiction.suggested);
      }
    });
  }

  /**
   * コメント修正の適用
   */
  private applyCommentCorrection(analysis: any, contradiction: Contradiction): void {
    // 強み・弱みの配列内の修正
    if (analysis.detailedAnalysis?.strengths) {
      const index = analysis.detailedAnalysis.strengths.indexOf(contradiction.original);
      if (index !== -1) {
        analysis.detailedAnalysis.strengths[index] = contradiction.suggested;
      }
    }
  }

  /**
   * 感情分析
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveKeywords = ['便利', '快適', '良い', '優秀', '素晴らしい', '充実', '豊富', '満足'];
    const negativeKeywords = ['不便', '不足', '劣る', '困難', '制約', '問題', '厳しい', '危険'];
    
    const lowerText = text.toLowerCase();
    
    const positiveCount = positiveKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const negativeCount = negativeKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * スコアから期待される感情を取得
   */
  private getExpectedSentiment(score: number): 'positive' | 'neutral' | 'negative' {
    const threshold = this.getThresholdForScore(score);
    return threshold.sentiment;
  }

  /**
   * スコアに対応する閾値を取得
   */
  private getThresholdForScore(score: number): ScoreThreshold {
    return this.SCORE_THRESHOLDS.find(threshold => 
      score >= threshold.min && score <= threshold.max
    ) || this.SCORE_THRESHOLDS[this.SCORE_THRESHOLDS.length - 1];
  }

  /**
   * 一貫性のあるコメントを生成
   */
  private generateConsistentComment(score: number, category: string, context: string): string {
    const threshold = this.getThresholdForScore(score);
    const formattedScore = this.formatScore(score);
    
    const templates = {
      strength: {
        positive: `${category}${formattedScore}点で${threshold.keywords[Math.floor(Math.random() * 2)]}な環境です`,
        neutral: `${category}${formattedScore}点で${threshold.keywords[0]}なレベルです`,
        negative: `${category}は${formattedScore}点と${threshold.keywords[0]}ですが、改善の可能性があります`
      },
      weakness: {
        positive: `${category}${formattedScore}点と良好ですが、さらなる向上の余地があります`,
        neutral: `${category}${formattedScore}点で${threshold.keywords[0]}なレベルです`,
        negative: `${category}${formattedScore}点で${threshold.keywords[0]}しており、対策が必要です`
      },
      general: {
        positive: `${category}が${threshold.keywords[0]}で、快適に利用できます`,
        neutral: `${category}は${threshold.keywords[0]}なレベルです`,
        negative: `${category}に${threshold.keywords[0]}があり、注意が必要です`
      }
    };

    return templates[context as keyof typeof templates]?.[threshold.sentiment] || 
           `${category}は${formattedScore}点で${threshold.label}な状況です`;
  }

  /**
   * スコアをフォーマット
   */
  private formatScore(score: number): string {
    const rounded = Math.round(score * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  }

  /**
   * カテゴリ抽出
   */
  private extractCategory(text: string): string {
    const categories = ['交通', 'アクセス', '買い物', '商業', '医療', '教育', '環境', '安全', '経済'];
    return categories.find(cat => text.includes(cat)) || 'その他';
  }

  /**
   * 関連コメント検索
   */
  private findRelatedComments(analysis: any, category: string): string[] {
    const comments: string[] = [];
    
    // 強み・弱みから検索
    if (analysis.detailedAnalysis?.strengths) {
      comments.push(...analysis.detailedAnalysis.strengths.filter((s: string) => 
        this.extractCategory(s) === category
      ));
    }
    
    if (analysis.detailedAnalysis?.weaknesses) {
      comments.push(...analysis.detailedAnalysis.weaknesses.filter((w: string) => 
        this.extractCategory(w) === category
      ));
    }

    return comments;
  }

  /**
   * 品質スコア計算
   */
  private calculateQualityScore(contradictions: Contradiction[]): number {
    if (contradictions.length === 0) return 100;
    
    const weights = {
      'critical': 20,
      'high': 10,
      'medium': 5,
      'low': 2
    };
    
    const totalPenalty = contradictions.reduce((sum, contradiction) => {
      return sum + weights[contradiction.severity];
    }, 0);
    
    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * 改善提案生成
   */
  private generateImprovements(contradictions: Contradiction[]): string[] {
    const improvements: string[] = [];
    
    const severeCounts = contradictions.filter(c => c.severity === 'critical' || c.severity === 'high').length;
    const mediumCounts = contradictions.filter(c => c.severity === 'medium').length;
    const lowCounts = contradictions.filter(c => c.severity === 'low').length;
    
    if (severeCounts > 0) {
      improvements.push(`${severeCounts}件の重要な一貫性問題を修正しました`);
    }
    
    if (mediumCounts > 0) {
      improvements.push(`${mediumCounts}件の数値精度問題を改善しました`);
    }
    
    if (lowCounts > 0) {
      improvements.push(`${lowCounts}件の軽微な表記問題を調整しました`);
    }
    
    if (improvements.length === 0) {
      improvements.push('分析結果に一貫性の問題は見つかりませんでした');
    }
    
    return improvements;
  }

  /**
   * オブジェクト走査ユーティリティ
   */
  private traverseObject(obj: any, callback: (value: any, path: string) => void, path: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.traverseObject(value, callback, currentPath);
      } else {
        callback(value, currentPath);
      }
    }
  }

  /**
   * ネストしたプロパティ設定
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * 矛盾するカテゴリの解決
   */
  private resolveContradictoryCategories(strength: string, weakness: string): any {
    // より具体的な分析に基づいて解決
    const strengthScore = this.extractScore(strength);
    const weaknessScore = this.extractScore(weakness);
    
    if (strengthScore !== null && weaknessScore !== null) {
      // スコアに基づいて判定
      if (strengthScore >= 60) {
        return { resolved: strength, removed: weakness };
      } else {
        return { resolved: weakness, removed: strength };
      }
    }
    
    // デフォルトは弱みを優先（保守的判断）
    return { resolved: weakness, removed: strength };
  }

  /**
   * テキストからスコア抽出
   */
  private extractScore(text: string): number | null {
    const match = text.match(/(\d+(?:\.\d+)?)点/);
    return match ? parseFloat(match[1]) : null;
  }
}

// シングルトンインスタンス
export const consistencyChecker = new ConsistencyChecker();