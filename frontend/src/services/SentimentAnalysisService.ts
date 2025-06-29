// 感情分析サービス
// OpenAI APIを使用してレビューテキストの感情分析を実行

interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  score: number; // -1.0 (非常にネガティブ) から 1.0 (非常にポジティブ)
  keywords: {
    positive: string[];
    negative: string[];
  };
}

interface BatchSentimentResult {
  results: SentimentAnalysisResult[];
  summary: {
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    averageScore: number;
    commonPositiveKeywords: string[];
    commonNegativeKeywords: string[];
    overallSentiment: 'positive' | 'negative' | 'neutral';
  };
}

export class SentimentAnalysisService {
  private static readonly openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
  private static readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  /**
   * 🔍 APIキーの状態をチェック
   */
  private static checkApiKeyStatus(): void {
    console.log(`🔑 OpenAI APIキーの読み込み状態: ${this.openaiApiKey ? '✅ 設定済み' : '❌ 未設定'}`);
    if (this.openaiApiKey && this.openaiApiKey.startsWith('sk-')) {
      console.log(`🔑 APIキーのプレフィックス: ${this.openaiApiKey.substring(0, 10)}...`);
    }
  }

  /**
   * 🧠 単一テキストの感情分析
   */
  static async analyzeSentiment(text: string, rating?: number): Promise<SentimentAnalysisResult> {
    try {
      console.log(`🧠 感情分析実行: "${text.substring(0, 50)}..."`);      
      
      // APIキーの状態をチェック
      this.checkApiKeyStatus();

      // 簡易感情分析（フォールバック）
      if (!this.openaiApiKey || this.openaiApiKey === 'YOUR_OPENAI_API_KEY' || !this.openaiApiKey.startsWith('sk-')) {
        console.warn('⚠️ OpenAI APIキーが設定されていません。簡易分析を使用します。');
        console.log(`🔍 現在のキー: ${this.openaiApiKey ? this.openaiApiKey.substring(0, 20) + '...' : 'undefined'}`);
        return this.simpleSpentimentAnalysis(text, rating);
      }

      // OpenAI APIを使用した高精度感情分析
      const prompt = this.createSentimentPrompt(text, rating);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'あなたは日本語の感情分析専門家です。レビューテキストを分析して、感情を判定してください。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API エラー: ${response.status}`);
      }

      const data = await response.json();
      const result = this.parseOpenAIResponse(data.choices[0].message.content);
      
      console.log(`✅ 感情分析完了: ${result.sentiment} (信頼度: ${result.confidence})`);
      return result;

    } catch (error: any) {
      console.error('❌ 感情分析エラー:', error.message);
      // エラー時は簡易分析にフォールバック
      return this.simpleSpentimentAnalysis(text, rating);
    }
  }

  /**
   * 📊 複数テキストの一括感情分析
   */
  static async analyzeBatchSentiment(
    texts: Array<{ text: string; rating?: number }>
  ): Promise<BatchSentimentResult> {
    try {
      console.log(`📊 一括感情分析開始: ${texts.length}件のテキスト`);

      // 各テキストを並列で分析
      const analysisPromises = texts.map(item => 
        this.analyzeSentiment(item.text, item.rating)
      );

      const results = await Promise.all(analysisPromises);
      
      // サマリーを生成
      const summary = this.generateSummary(results);
      
      console.log(`✅ 一括感情分析完了: ${summary.overallSentiment} (平均スコア: ${summary.averageScore.toFixed(2)})`);

      return {
        results,
        summary
      };

    } catch (error: any) {
      console.error('❌ 一括感情分析エラー:', error.message);
      
      // エラー時は空の結果を返す
      return {
        results: [],
        summary: {
          positivePercentage: 0,
          negativePercentage: 0,
          neutralPercentage: 0,
          averageScore: 0,
          commonPositiveKeywords: [],
          commonNegativeKeywords: [],
          overallSentiment: 'neutral'
        }
      };
    }
  }

  /**
   * 🔧 OpenAI用のプロンプトを作成
   */
  private static createSentimentPrompt(text: string, rating?: number): string {
    const basePrompt = `
以下のレビューテキストを感情分析してください。

レビューテキスト: "${text}"
${rating ? `星評価: ${rating}/5` : ''}

以下のJSON形式で回答してください：
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "score": -1.0から1.0の数値,
  "positive_keywords": ["キーワード1", "キーワード2"],
  "negative_keywords": ["キーワード1", "キーワード2"]
}

分析基準：
- positive: 好意的、満足、推奨する内容
- negative: 不満、批判、改善点の指摘
- neutral: 客観的な事実の記述、どちらでもない
- score: -1.0(非常にネガティブ) ～ 1.0(非常にポジティブ)
- confidence: 判定の確信度
`;

    return basePrompt.trim();
  }

  /**
   * 🔍 OpenAIレスポンスの解析
   */
  private static parseOpenAIResponse(response: string): SentimentAnalysisResult {
    try {
      // JSONの抽出を試行
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON形式が見つかりません');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        sentiment: parsed.sentiment || 'neutral',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        score: Math.max(-1, Math.min(1, parsed.score || 0)),
        keywords: {
          positive: Array.isArray(parsed.positive_keywords) ? parsed.positive_keywords : [],
          negative: Array.isArray(parsed.negative_keywords) ? parsed.negative_keywords : []
        }
      };

    } catch (error) {
      console.warn('⚠️ OpenAIレスポンス解析失敗。デフォルト値を使用。');
      return {
        sentiment: 'neutral',
        confidence: 0.3,
        score: 0,
        keywords: { positive: [], negative: [] }
      };
    }
  }

  /**
   * 🔨 簡易感情分析（フォールバック）
   */
  private static simpleSpentimentAnalysis(text: string, rating?: number): SentimentAnalysisResult {
    const positiveWords = [
      '良い', 'いい', '素晴らしい', '最高', 'おすすめ', '快適', '便利', '親切', '清潔',
      '美味しい', '満足', '安心', '丁寧', '優しい', '楽しい', '綺麗', 'きれい'
    ];
    
    const negativeWords = [
      '悪い', 'わるい', 'ひどい', '最悪', '不便', '汚い', '遅い', '高い', '失礼',
      '不満', '残念', '困る', 'だめ', '不安', 'うるさい', '混雑', '待つ'
    ];

    const lowerText = text.toLowerCase();
    let score = rating ? (rating - 3) / 2 : 0; // 星評価を-1～1に正規化

    let positiveCount = 0;
    let negativeCount = 0;
    const foundPositive: string[] = [];
    const foundNegative: string[] = [];

    // ポジティブワードチェック
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) {
        positiveCount++;
        foundPositive.push(word);
        score += 0.2;
      }
    });

    // ネガティブワードチェック
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) {
        negativeCount++;
        foundNegative.push(word);
        score -= 0.2;
      }
    });

    // スコアを-1～1に正規化
    score = Math.max(-1, Math.min(1, score));

    // 感情を判定
    let sentiment: 'positive' | 'negative' | 'neutral';
    if (score > 0.2) sentiment = 'positive';
    else if (score < -0.2) sentiment = 'negative';
    else sentiment = 'neutral';

    // 信頼度を計算
    const totalWords = positiveCount + negativeCount;
    const confidence = Math.min(0.8, 0.3 + (totalWords * 0.1));

    return {
      sentiment,
      confidence,
      score,
      keywords: {
        positive: foundPositive.slice(0, 3),
        negative: foundNegative.slice(0, 3)
      }
    };
  }

  /**
   * 📈 分析結果のサマリー生成
   */
  private static generateSummary(results: SentimentAnalysisResult[]): BatchSentimentResult['summary'] {
    if (results.length === 0) {
      return {
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        averageScore: 0,
        commonPositiveKeywords: [],
        commonNegativeKeywords: [],
        overallSentiment: 'neutral'
      };
    }

    // 感情の分布を計算
    const positiveCount = results.filter(r => r.sentiment === 'positive').length;
    const negativeCount = results.filter(r => r.sentiment === 'negative').length;
    const neutralCount = results.filter(r => r.sentiment === 'neutral').length;

    const total = results.length;

    // 平均スコアを計算
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / total;

    // 共通キーワードを抽出
    const allPositiveKeywords = results.flatMap(r => r.keywords.positive);
    const allNegativeKeywords = results.flatMap(r => r.keywords.negative);

    const commonPositiveKeywords = this.getTopKeywords(allPositiveKeywords, 5);
    const commonNegativeKeywords = this.getTopKeywords(allNegativeKeywords, 3);

    // 全体的な感情を判定
    let overallSentiment: 'positive' | 'negative' | 'neutral';
    if (averageScore > 0.2) overallSentiment = 'positive';
    else if (averageScore < -0.2) overallSentiment = 'negative';
    else overallSentiment = 'neutral';

    return {
      positivePercentage: (positiveCount / total) * 100,
      negativePercentage: (negativeCount / total) * 100,
      neutralPercentage: (neutralCount / total) * 100,
      averageScore,
      commonPositiveKeywords,
      commonNegativeKeywords,
      overallSentiment
    };
  }

  /**
   * 📝 頻出キーワードを抽出
   */
  private static getTopKeywords(keywords: string[], limit: number): string[] {
    const keywordCount = new Map<string, number>();
    
    keywords.forEach(keyword => {
      keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
    });

    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0]);
  }

  /**
   * 🧪 感情分析のテスト
   */
  static async testSentimentAnalysis(): Promise<void> {
    console.log('🧪 感情分析テスト開始...');

    const testTexts = [
      { text: 'スタッフの対応が素晴らしく、料理も美味しかったです。', rating: 5 },
      { text: '待ち時間が長すぎて、料理も冷めていました。', rating: 2 },
      { text: '普通の店でした。特に印象に残ることはありません。', rating: 3 },
      { text: '清潔で便利な立地です。おすすめできます。', rating: 4 },
      { text: '価格が高すぎて満足できませんでした。', rating: 2 }
    ];

    try {
      const batchResult = await this.analyzeBatchSentiment(testTexts);
      
      console.log('📊 テスト結果:');
      console.log(`全体感情: ${batchResult.summary.overallSentiment}`);
      console.log(`平均スコア: ${batchResult.summary.averageScore.toFixed(2)}`);
      console.log(`ポジティブ: ${batchResult.summary.positivePercentage.toFixed(1)}%`);
      console.log(`ネガティブ: ${batchResult.summary.negativePercentage.toFixed(1)}%`);
      console.log(`共通ポジティブキーワード: ${batchResult.summary.commonPositiveKeywords.join(', ')}`);
      console.log(`共通ネガティブキーワード: ${batchResult.summary.commonNegativeKeywords.join(', ')}`);
      
      console.log('✅ 感情分析テスト完了');
      
    } catch (error) {
      console.error('❌ 感情分析テスト失敗:', error);
    }
  }
}

export default SentimentAnalysisService;

// 型定義のエクスポート
export type { SentimentAnalysisResult, BatchSentimentResult };
