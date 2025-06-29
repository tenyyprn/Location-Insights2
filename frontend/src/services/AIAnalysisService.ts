// 現実的で地理的に正確なAI分析サービス（修正版）

interface LifestyleAnalysisData {
  address: string;
  coordinates: { lat: number; lng: number };
  educationCount: number;
  medicalCount: number;
  commercialCount: number;
  transportCount: number;
  environmentCount: number;
  safetyCount: number;
  culturalCount?: number;
  totalScore: number;
  scores: {
    education: number;
    medical: number;
    transport: number;
    shopping: number;
    dining: number;
    safety: number;
    environment: number;
    cultural: number;
  };
  educationDetails: any[];
  medicalDetails: any[];
  commercialDetails: any[];
  diningDetails?: any[];
  transportDetails: any[];
  culturalDetails?: any[];
}

interface AIAnalysisResult {
  overallEvaluation: string;
  strengthsAnalysis: string;
  weaknessesAnalysis: string;
  recommendations: string[];
  livingQualityScore: number;
  familyFriendliness: string;
  suitableFor: string[];
  improvements: string[];
  detailedComment: string;
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  futurePredict: {
    oneYear: string;
    threeYears: string;
    fiveYears: string;
  };
  competitorAnalysis: {
    currentRank: number;
    competitors: Array<{
      name: string;
      description: string;
      score: number;
    }>;
  };
  lifestyleRecommendations: {
    families: string;
    workers: string;
    seniors: string;
    creatives: string;
  };
}

class AIAnalysisService {
  private readonly apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? '/api'
      : 'http://localhost:8002/api';
  }

  /**
   * 現実的で地理的に正確なAI分析生成（メイン関数）
   */
  async generateLifestyleAnalysis(data: LifestyleAnalysisData): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 実データベース AI分析を開始...', data.address);

      // 地理的現実性を考慮した実データベース分析を実行
      return this.generateRealisticDataAnalysis(data);

    } catch (error) {
      console.error('❌ AI分析エラー:', error);
      return this.generateRealisticDataAnalysis(data);
    }
  }

  /**
   * 🔧 地理的現実性を考慮した分析
   */
  private generateRealisticDataAnalysis(data: LifestyleAnalysisData): AIAnalysisResult {
    console.log('🚀 実データベース強化分析を実行');

    // 地理情報を抽出
    const locationInfo = this.extractLocationInfo(data.address);
    
    // スコア分析（現実的評価）
    const scoreAnalysis = this.analyzeScoresRealistically(data.scores, locationInfo);
    
    // 地理的現実性を考慮した洞察生成
    const insights = this.generateRealisticInsights(data, scoreAnalysis, locationInfo);
    
    // 現実的なSWOT分析生成
    const swotAnalysis = this.generateRealisticSWOT(data, scoreAnalysis, locationInfo);
    
    // 地域特性に基づいた将来予測
    const futurePredict = this.generateRealisticFuture(data, scoreAnalysis, locationInfo);
    
    // 実在する地域を考慮した競合分析
    const competitorAnalysis = this.generateRealisticCompetitors(data, locationInfo);
    
    // ライフスタイル別推奨（地域特性考慮）
    const lifestyleRecommendations = this.generateRealisticLifestyle(data, scoreAnalysis, locationInfo);

    return {
      overallEvaluation: insights.overallEvaluation,
      strengthsAnalysis: insights.strengthsAnalysis,
      weaknessesAnalysis: insights.weaknessesAnalysis,
      recommendations: insights.recommendations,
      livingQualityScore: Math.round(data.totalScore),
      familyFriendliness: insights.familyFriendliness,
      suitableFor: insights.suitableFor,
      improvements: insights.improvements,
      detailedComment: insights.detailedComment,
      swotAnalysis,
      futurePredict,
      competitorAnalysis,
      lifestyleRecommendations
    };
  }

  /**
   * 🗾 地理情報抽出
   */
  private extractLocationInfo(address: string) {
    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];
    
    const prefecture = prefectures.find(p => address.includes(p)) || '';
    const cityMatch = address.match(/[都道府県]([^市区町村]+[市区町村])/);
    const city = cityMatch ? cityMatch[1] : '';
    
    // 地域分類
    const isMetropolitan = ['東京都', '神奈川県', '埼玉県', '千葉県'].includes(prefecture);
    const isMajorCity = ['大阪府', '京都府', '兵庫県', '愛知県', '福岡県'].includes(prefecture);
    const isRural = !isMetropolitan && !isMajorCity;
    
    return {
      prefecture,
      city,
      isMetropolitan,
      isMajorCity,
      isRural,
      region: isMetropolitan ? '首都圏' : isMajorCity ? '主要都市圏' : '地方'
    };
  }

  /**
   * 📊 現実的なスコア分析
   */
  private analyzeScoresRealistically(scores: any, locationInfo: any) {
    // 地域特性を考慮したスコア評価
    const adjustedScores = { ...scores };
    
    // 地方部では交通スコアの基準を調整
    if (locationInfo.isRural && scores.transport < 70) {
      // 地方では自家用車前提なので、交通スコアを相対的に評価
      adjustedScores.transport = Math.min(scores.transport + 10, 100);
    }
    
    const categoryNames = {
      education: '教育環境',
      medical: '医療・福祉',
      transport: '交通利便性',
      shopping: '買い物利便性',
      dining: '飲食環境',
      safety: '安全性',
      environment: '環境・快適性',
      cultural: '文化・娯楽'
    };

    const highScores = Object.entries(adjustedScores).filter(([_, score]) => (score as number) >= 80);
    const mediumScores = Object.entries(adjustedScores).filter(([_, score]) => (score as number) >= 60 && (score as number) < 80);
    const lowScores = Object.entries(adjustedScores).filter(([_, score]) => (score as number) < 60);

    return {
      highScores: highScores.map(([key, score]) => ({
        category: categoryNames[key as keyof typeof categoryNames] || key,
        score: score as number
      })),
      mediumScores: mediumScores.map(([key, score]) => ({
        category: categoryNames[key as keyof typeof categoryNames] || key,
        score: score as number
      })),
      lowScores: lowScores.map(([key, score]) => ({
        category: categoryNames[key as keyof typeof categoryNames] || key,
        score: score as number
      })),
      originalScores: scores,
      adjustedScores
    };
  }

  /**
   * 💡 地理的現実性を考慮した洞察生成
   */
  private generateRealisticInsights(data: LifestyleAnalysisData, scoreAnalysis: any, locationInfo: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { highScores, mediumScores, lowScores } = scoreAnalysis;
    
    // 強み分析（地域特性考慮）
    const strengthsAnalysis = highScores.length > 0 
      ? `${highScores.map((s: any) => s.category).join('、')}が特に優秀で、${locationInfo.region}として良好な水準です。`
      : `${locationInfo.region}として標準的な生活環境が整っています。`;

    // 弱み分析（現実的評価）
    let weaknessesAnalysis = '';
    if (lowScores.length > 0) {
      const mainWeakness = lowScores[0];
      if (locationInfo.isRural && mainWeakness.category === '交通利便性') {
        weaknessesAnalysis = `地方部としては一般的ですが、自家用車の利用を前提とした生活設計が必要です。`;
      } else {
        weaknessesAnalysis = `${lowScores.map((s: any) => s.category).join('、')}に改善の余地があり、特に${mainWeakness.category}は${mainWeakness.score}点と${locationInfo.region}平均を下回ります。`;
      }
    } else {
      weaknessesAnalysis = `目立った弱点はなく、${locationInfo.region}として良好なバランスです。`;
    }

    // 総合評価（地理的現実性考慮）
    let overallEvaluation = '';
    let familyFriendliness = '';
    let suitableFor: string[] = [];

    if (data.totalScore >= 85) {
      if (locationInfo.isMetropolitan) {
        overallEvaluation = '都市部として非常に優れた住環境を備えており、多様なライフスタイルに対応できます。';
        familyFriendliness = '家族連れに最適な都市環境';
        suitableFor = ['ファミリー世帯', '通勤者', 'シニア世帯'];
      } else {
        overallEvaluation = `${locationInfo.region}として優秀な住環境で、自然と利便性のバランスが取れています。`;
        familyFriendliness = '家族連れに適した地域環境';
        suitableFor = ['ファミリー世帯', '自然志向世帯', 'リモートワーカー'];
      }
    } else if (data.totalScore >= 70) {
      if (locationInfo.isMetropolitan) {
        overallEvaluation = '都市部としては標準的な住環境で、通勤・通学に便利な立地です。';
        familyFriendliness = '家族連れに適している';
        suitableFor = ['通勤者', '単身者', '共働き世帯'];
      } else {
        overallEvaluation = `${locationInfo.region}として良好な住環境で、落ち着いた生活を送れます。`;
        familyFriendliness = '子育て世帯に適している';
        suitableFor = ['ファミリー世帯', '静かな環境を求める世帯'];
      }
    } else if (data.totalScore >= 60) {
      overallEvaluation = `${locationInfo.region}として基本的な生活環境は整っており、コストパフォーマンスを重視する方に適しています。`;
      familyFriendliness = '工夫次第で家族連れにも対応可能';
      suitableFor = ['予算重視世帯', '単身者'];
    } else {
      overallEvaluation = `生活コストを抑えたい方や、将来的な地域発展を期待する方に適した地域です。`;
      familyFriendliness = '単身者や予算重視の世帯向け';
      suitableFor = ['予算重視世帯', '若い単身者', '投資目的'];
    }

    // 推奨事項（地域特性考慮）
    const recommendations = this.generateRealisticRecommendations(lowScores, locationInfo);

    return {
      overallEvaluation,
      strengthsAnalysis,
      weaknessesAnalysis,
      recommendations,
      familyFriendliness,
      suitableFor,
      improvements: lowScores.map((s: any) => s.category),
      detailedComment: `${data.address}は総合スコア${data.totalScore.toFixed(1)}点の住環境です。${overallEvaluation}`
    };
  }

  /**
   * 💡 現実的な推奨事項生成
   */
  private generateRealisticRecommendations(lowScores: any[], locationInfo: any): string[] {
    const recommendations: string[] = [];
    
    lowScores.forEach((score: any) => {
      switch (score.category) {
        case '安全性':
          recommendations.push('地域の防犯情報を定期的に確認し、近隣住民との連携を図る');
          break;
        case '買い物利便性':
          if (locationInfo.isRural) {
            recommendations.push('ネットスーパーや移動販売サービスの活用を検討');
          } else {
            recommendations.push('近隣商業施設の営業時間や配達サービスを事前調査');
          }
          break;
        case '交通利便性':
          if (locationInfo.isRural) {
            recommendations.push('自家用車の確保と地域コミュニティバスの利用検討');
          } else {
            recommendations.push('複数の交通手段の組み合わせによる移動最適化');
          }
          break;
        case '医療・福祉':
          recommendations.push('かかりつけ医の確保と緊急時の医療体制を事前確認');
          break;
        case '教育環境':
          recommendations.push('近隣教育機関の詳細調査と教育方針の事前確認');
          break;
        case '文化・娯楽':
          if (locationInfo.isMetropolitan) {
            recommendations.push('近隣地域の文化施設やイベント情報の積極的な収集');
          } else {
            recommendations.push('自然環境を活かしたアウトドア活動の検討');
          }
          break;
      }
    });
    
    if (recommendations.length === 0) {
      if (locationInfo.isMetropolitan) {
        recommendations.push('都市部の利便性を最大限活用した効率的な生活スタイルの構築');
      } else {
        recommendations.push('地域特性を活かした豊かなライフスタイルの構築');
      }
    }
    
    return recommendations;
  }

  /**
   * 🔍 現実的なSWOT分析生成
   */
  private generateRealisticSWOT(data: LifestyleAnalysisData, scoreAnalysis: any, locationInfo: any) {
    const { highScores, lowScores } = scoreAnalysis;

    // Strengths（強み）- 実際のスコアに基づく
    const strengths: string[] = [];
    highScores.forEach((score: any) => {
      switch (score.category) {
        case '教育環境':
          strengths.push(`${locationInfo.region}として教育機関が充実`);
          break;
        case '医療・福祉':
          strengths.push('医療施設へのアクセスが良好');
          break;
        case '交通利便性':
          if (locationInfo.isMetropolitan) {
            strengths.push('公共交通機関のアクセスが優秀');
          } else {
            strengths.push('地域内移動の利便性が良好');
          }
          break;
        case '安全性':
          strengths.push(`${locationInfo.region}として高い安全性`);
          break;
        case '環境・快適性':
          strengths.push('良好な住環境と自然環境');
          break;
      }
    });

    // Weaknesses（弱み）- 現実的な評価
    const weaknesses: string[] = [];
    if (lowScores.length > 0) {
      lowScores.forEach((score: any) => {
        if (score.category === '交通利便性' && locationInfo.isRural) {
          weaknesses.push('公共交通機関の限定性（自家用車必須）');
        } else {
          weaknesses.push(`${score.category}の充実度向上が課題`);
        }
      });
    }

    // Opportunities（機会）- 地域特性に応じて
    const opportunities: string[] = [];
    if (locationInfo.isMetropolitan) {
      opportunities.push('都市再開発による利便性向上の可能性');
      opportunities.push('新規商業施設やサービスの誘致期待');
    } else if (locationInfo.isMajorCity) {
      opportunities.push('地方中枢都市としての機能強化');
      opportunities.push('移住促進政策による地域活性化');
    } else {
      opportunities.push('地方創生施策による地域振興');
      opportunities.push('自然環境を活かした観光・居住地としての発展');
    }

    // Threats（脅威）- 現実的なリスク
    const threats: string[] = [];
    if (locationInfo.isMetropolitan) {
      threats.push('都市部特有の生活コスト上昇リスク');
      if (data.totalScore < 70) {
        threats.push('近隣地域との競争による相対的地位低下');
      }
    } else {
      threats.push('人口減少による公共サービスの維持課題');
      if (lowScores.some((s: any) => s.category === '交通利便性')) {
        threats.push('公共交通機関の路線維持・存続リスク');
      }
    }

    return { strengths, weaknesses, opportunities, threats };
  }

  /**
   * 🔮 現実的な将来予測
   */
  private generateRealisticFuture(data: LifestyleAnalysisData, scoreAnalysis: any, locationInfo: any) {
    let oneYear = '';
    let threeYears = '';
    let fiveYears = '';

    if (locationInfo.isMetropolitan) {
      if (data.totalScore >= 80) {
        oneYear = '都市機能の継続的改善により、現在の高水準が維持されます';
        threeYears = '新規開発プロジェクトにより、さらなる利便性向上が期待';
        fiveYears = '成熟した都市インフラとして、長期的な住みやすさが確立';
      } else {
        oneYear = '都市計画の進展により、基本的な利便性改善が期待されます';
        threeYears = '段階的なインフラ整備により、住環境の質的向上';
        fiveYears = '都市部標準レベルの住環境達成';
      }
    } else if (locationInfo.isMajorCity) {
      oneYear = '地方中枢都市として、継続的な機能強化が進みます';
      threeYears = '広域連携による交通・商業インフラの充実';
      fiveYears = '地方の拠点都市として、独自の魅力を持つ地域に発展';
    } else {
      oneYear = '地方創生施策により、基本的な生活インフラが改善';
      threeYears = 'デジタル化推進により、遠隔サービスの充実が進展';
      fiveYears = '自然環境と利便性を両立した、持続可能な地域として発展';
    }

    return { oneYear, threeYears, fiveYears };
  }

  /**
   * 🏘️ 現実的な競合分析
   */
  private generateRealisticCompetitors(data: LifestyleAnalysisData, locationInfo: any) {
    // 地域特性に応じた現実的な競合設定
    const competitors = [];
    
    if (locationInfo.isMetropolitan) {
      competitors.push({
        name: `${locationInfo.prefecture}内の類似エリア`,
        description: '同等の都市機能を持つ地域',
        score: Math.round((data.totalScore * 0.95) * 10) / 10
      });
    } else {
      competitors.push({
        name: `${locationInfo.region}の中心部`,
        description: '地域の商業・行政中心地',
        score: Math.round((data.totalScore * 1.05) * 10) / 10
      });
    }

    // 現在地域のランク計算（控えめに）
    const currentRank = competitors.length + 1;

    return {
      currentRank,
      competitors
    };
  }

  /**
   * 👨‍👩‍👧‍👦 地域特性を考慮したライフスタイル推奨
   */
  private generateRealisticLifestyle(data: LifestyleAnalysisData, scoreAnalysis: any, locationInfo: any) {
    const { highScores } = scoreAnalysis;

    const families = highScores.some((s: any) => s.category === '教育環境')
      ? `${locationInfo.region}として教育環境が充実しており、子育てに適しています`
      : `${locationInfo.region}として基本的な子育て環境は整っていますが、選択肢の事前確認をお勧めします`;

    const workers = (() => {
      if (locationInfo.isMetropolitan) {
        return highScores.some((s: any) => s.category === '交通利便性')
          ? '都市部として通勤アクセスが良好で、キャリア形成に有利'
          : '都市部での就業機会は豊富ですが、通勤手段の検討が必要';
      } else {
        return 'リモートワークや地域密着型の仕事に適した環境です';
      }
    })();

    const seniors = highScores.some((s: any) => s.category === '医療・福祉')
      ? `${locationInfo.region}として医療体制が整っており、安心して生活できます`
      : '基本的な医療サービスはありますが、専門医療は事前確認が必要です';

    const creatives = (() => {
      if (highScores.some((s: any) => s.category === '文化・娯楽')) {
        return `${locationInfo.region}として文化施設が充実しており、創作活動に適した環境`;
      } else if (locationInfo.isRural) {
        return '自然環境が豊かで、インスピレーションを得やすい環境です';
      } else {
        return '創作活動には工夫が必要ですが、コストを抑えた制作環境を構築可能';
      }
    })();

    return { families, workers, seniors, creatives };
  }
}

export const aiAnalysisService = new AIAnalysisService();
export type { LifestyleAnalysisData, AIAnalysisResult };