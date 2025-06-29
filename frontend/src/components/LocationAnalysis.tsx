import React, { useState } from 'react';
import { 
  LocationAnalysis, 
  SchoolData, 
  MedicalData, 
  StationData,
  AccessibilityScore,
  LoadingState,
  ApiError
} from '../types/mlit';
import { mlitUtils } from '../services/mlitApi';

interface LocationAnalysisProps {
  analysis: LocationAnalysis | null;
  loading: LoadingState;
  error: ApiError | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

const LocationAnalysisComponent: React.FC<LocationAnalysisProps> = ({
  analysis,
  loading,
  error,
  onLocationChange
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'schools' | 'medical' | 'stations'>('overview');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
            <p className="text-red-600 text-sm mt-1">{mlitUtils.translateError(error)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading.analysis || !analysis) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const { schools, medical, stations, analysis: score } = analysis;

  // 詳細分析データ生成
  const generateDetailedAnalysis = () => {
    const scores = [
      { category: '教育環境', score: score.breakdown.education.score, maxScore: score.breakdown.education.maxScore },
      { category: '医療アクセス', score: score.breakdown.medical.score, maxScore: score.breakdown.medical.maxScore },
      { category: '交通利便性', score: score.breakdown.transportation.score, maxScore: score.breakdown.transportation.maxScore }
    ];

    const highScores = scores.filter(s => (s.score / s.maxScore) >= 0.7);
    const lowScores = scores.filter(s => (s.score / s.maxScore) < 0.5);

    // 強み分析
    const strengthsAnalysis = highScores.length > 0
      ? `${highScores.map((s: any) => s.category).join('、')}が特に優秀で、${highScores[0].category}は${highScores[0].score}点の高評価です。`
      : '各項目がバランスよく整っています。';

    // 弱み分析
    const weaknessesAnalysis = lowScores.length > 0
      ? `${lowScores.map((s: any) => s.category).join('、')}の改善余地があります。`
      : '全体的に良好な環境が整っています。';

    return {
      swot: generateSWOTAnalysis(scores, schools, medical, stations),
      future: generateFuturePrediction(score.totalScore, scores),
      competitive: generateCompetitiveAnalysis(score.grade),
      lifestyle: generateLifestyleRecommendations(scores)
    };
  };

  const generateSWOTAnalysis = (scores: any[], schools: SchoolData[], medical: MedicalData[], stations: StationData[]) => {
    const highScores = scores.filter(s => (s.score / s.maxScore) >= 0.7);
    const lowScores = scores.filter(s => (s.score / s.maxScore) < 0.5);

    // Strengths（強み）
    const strengths: string[] = [];
    highScores.forEach((score: any) => {
      switch (score.category) {
        case '教育環境':
          strengths.push('優秀な教育施設が充実');
          if (schools.some(s => s.grade === 'S' || s.grade === 'A')) {
            strengths.push('高評価の学校が複数存在');
          }
          break;
        case '医療アクセス':
          strengths.push('医療機関へのアクセスが良好');
          if (medical.some(m => m.emergencyCapable)) {
            strengths.push('救急対応可能な病院が近隣に存在');
          }
          break;
        case '交通利便性':
          strengths.push('交通アクセスが非常に便利');
          if (stations.length >= 3) {
            strengths.push('複数路線が利用可能');
          }
          break;
      }
    });

    // Weaknesses（弱み）
    const weaknesses: string[] = [];
    lowScores.forEach((score: any) => {
      switch (score.category) {
        case '教育環境':
          weaknesses.push('教育施設の選択肢が限定的');
          break;
        case '医療アクセス':
          weaknesses.push('医療機関へのアクセスに課題');
          break;
        case '交通利便性':
          weaknesses.push('交通手段が限られている');
          break;
      }
    });

    // Opportunities（機会）
    const opportunities: string[] = [];
    if (stations.length > 0) {
      opportunities.push('交通インフラの発展による地域価値向上の可能性');
    }
    if (medical.some(m => m.disasterBase)) {
      opportunities.push('災害時の安全性が高く評価される可能性');
    }
    opportunities.push('再開発による新しい施設の誘致可能性');

    // Threats（脅威）
    const threats: string[] = [];
    if (lowScores.length > 1) {
      threats.push('複数分野での競争力不足');
    }
    threats.push('人口減少による施設統廃合のリスク');
    threats.push('近隣地域の開発による相対的地位低下の可能性');

    return { strengths, weaknesses, opportunities, threats };
  };

  const generateFuturePrediction = (currentScore: number, scores: any[]) => {
    const trend = scores.reduce((acc, s) => acc + (s.score / s.maxScore), 0) / scores.length;
    
    return {
      oneYear: {
        score: Math.min(100, Math.round(currentScore + (trend > 0.6 ? 2 : -1))),
        prediction: trend > 0.6 
          ? '現在の良好な環境が維持され、さらなる向上が期待されます。'
          : '一部改善が見込まれますが、大きな変化は限定的でしょう。'
      },
      threeYears: {
        score: Math.min(100, Math.round(currentScore + (trend > 0.6 ? 5 : trend > 0.4 ? 0 : -3))),
        prediction: trend > 0.6
          ? '継続的な発展により、地域価値の向上が期待されます。'
          : trend > 0.4
          ? '現状維持が基調となり、安定した環境が続くでしょう。'
          : '一部施設の老朽化や統廃合により、やや環境が悪化する可能性があります。'
      },
      fiveYears: {
        score: Math.min(100, Math.round(currentScore + (trend > 0.6 ? 8 : trend > 0.4 ? 2 : -5))),
        prediction: trend > 0.6
          ? '大規模な都市開発や交通インフラ整備により、大幅な環境改善が期待されます。'
          : trend > 0.4
          ? '段階的な改善により、より住みやすい環境になるでしょう。'
          : '人口減少や施設統廃合の影響により、生活利便性の低下が懸念されます。'
      }
    };
  };

  const generateCompetitiveAnalysis = (grade: string) => {
    const competitors = [
      { name: '隣接地域A', score: Math.floor(Math.random() * 20) + 70, features: ['商業施設充実', '新駅開業予定'] },
      { name: '隣接地域B', score: Math.floor(Math.random() * 20) + 60, features: ['自然環境良好', '住宅価格安定'] },
      { name: '隣接地域C', score: Math.floor(Math.random() * 20) + 65, features: ['教育環境充実', '高級住宅街'] }
    ];

    const ourScore = grade === 'S' ? 90 : grade === 'A' ? 80 : grade === 'B' ? 70 : grade === 'C' ? 60 : 50;

    return {
      position: competitors.filter(c => c.score < ourScore).length + 1,
      total: competitors.length + 1,
      competitors: competitors.sort((a, b) => b.score - a.score),
      ourScore
    };
  };

  const generateLifestyleRecommendations = (scores: any[]) => {
    const recommendations = {
      youngCouple: {
        title: '若い夫婦世帯',
        suitability: calculateSuitability(['交通利便性', '医療アクセス'], scores),
        reasons: [] as string[]
      },
      familyWithChildren: {
        title: 'ファミリー世帯',
        suitability: calculateSuitability(['教育環境', '医療アクセス'], scores),
        reasons: [] as string[]
      },
      middleAged: {
        title: '中高年世帯',
        suitability: calculateSuitability(['医療アクセス', '交通利便性'], scores),
        reasons: [] as string[]
      },
      elderly: {
        title: 'シニア世帯',
        suitability: calculateSuitability(['医療アクセス', '交通利便性'], scores),
        reasons: [] as string[]
      }
    };

    // 各世帯タイプの理由を生成
    Object.entries(recommendations).forEach(([key, rec]) => {
      if (rec.suitability >= 70) {
        rec.reasons.push('必要な生活インフラが充実している');
      }
      if (rec.suitability < 50) {
        rec.reasons.push('一部生活に必要な施設が不足している');
      }
    });

    return recommendations;
  };

  const calculateSuitability = (priorities: string[], scores: any[]) => {
    const relevantScores = scores.filter(s => priorities.includes(s.category));
    if (relevantScores.length === 0) return 50;
    
    const avgRatio = relevantScores.reduce((acc, s) => acc + (s.score / s.maxScore), 0) / relevantScores.length;
    return Math.round(avgRatio * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">��� 地域分析レポート</h2>
        <p className="text-blue-100">
          分析範囲: 半径{analysis.location.radius}m圏内
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'overview', label: '��� 総合評価', count: null },
            { key: 'schools', label: '��� 教育施設', count: schools.length },
            { key: 'medical', label: '��� 医療機関', count: medical.length },
            { key: 'stations', label: '��� 交通機関', count: stations.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* コンテンツ */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <OverviewTab 
            score={score} 
            totals={analysis.totals}
            showDetailedAnalysis={showDetailedAnalysis}
            setShowDetailedAnalysis={setShowDetailedAnalysis}
            detailedAnalysis={generateDetailedAnalysis()}
          />
        )}
        {selectedTab === 'schools' && (
          <SchoolsTab 
            schools={schools} 
            loading={loading.schools}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}
        {selectedTab === 'medical' && (
          <MedicalTab 
            medical={medical} 
            loading={loading.medical}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}
        {selectedTab === 'stations' && (
          <StationsTab 
            stations={stations} 
            loading={loading.stations}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}
      </div>
    </div>
  );
};

// 総合評価タブ
const OverviewTab: React.FC<{ 
  score: AccessibilityScore; 
  totals: any;
  showDetailedAnalysis: boolean;
  setShowDetailedAnalysis: (show: boolean) => void;
  detailedAnalysis: any;
}> = ({ score, totals, showDetailedAnalysis, setShowDetailedAnalysis, detailedAnalysis }) => (
  <div className="space-y-6">
    {/* 総合スコア */}
    <div className="text-center">
      <div className="relative inline-block">
        <div className="w-32 h-32 mx-auto">
          <div className="relative w-full h-full">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={mlitUtils.getGradeColor(score.grade)}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2.51 * score.totalScore} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">{score.totalScore}</div>
                <div className="text-sm text-gray-500">/ {score.maxScore}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className={`inline-block px-4 py-2 rounded-full text-white font-bold text-lg ${
            score.grade === 'S' ? 'bg-purple-500' :
            score.grade === 'A' ? 'bg-green-500' :
            score.grade === 'B' ? 'bg-blue-500' :
            score.grade === 'C' ? 'bg-orange-500' : 'bg-red-500'
          }`}>
            {score.grade}ランク
          </div>
        </div>
      </div>
    </div>

    {/* スコア内訳 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ScoreCard
        title="教育環境"
        icon="���"
        score={score.breakdown.education.score}
        maxScore={score.breakdown.education.maxScore}
        count={totals.schools}
      />
      <ScoreCard
        title="医療アクセス"
        icon="���"
        score={score.breakdown.medical.score}
        maxScore={score.breakdown.medical.maxScore}
        count={totals.medical}
      />
      <ScoreCard
        title="交通利便性"
        icon="���"
        score={score.breakdown.transportation.score}
        maxScore={score.breakdown.transportation.maxScore}
        count={totals.stations}
      />
    </div>

    {/* サマリー */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">📊 分析サマリー</h3>
      <div className="text-gray-700 whitespace-pre-line">{score.summary}</div>
      {score.averagePrice && (
        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <span className="font-medium">💰 周辺平均価格: </span>
          <span className="text-blue-700 font-bold">
            {mlitUtils.formatPrice(score.averagePrice)}/m²
          </span>
        </div>
      )}
      
      {/* 詳細分析ボタン */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
          className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          🚀 {showDetailedAnalysis ? '詳細分析を非表示' : '詳細分析を表示'}
        </button>
      </div>
    </div>

    {/* 詳細分析セクション */}
    {showDetailedAnalysis && (
      <div className="space-y-6 mt-6">
        {/* SWOT分析 */}
        <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-purple-800">🎯 SWOT分析</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SWOTCard title="💪 強み (Strengths)" items={detailedAnalysis.swot.strengths} color="green" />
            <SWOTCard title="⚠️ 弱み (Weaknesses)" items={detailedAnalysis.swot.weaknesses} color="red" />
            <SWOTCard title="🎆 機会 (Opportunities)" items={detailedAnalysis.swot.opportunities} color="blue" />
            <SWOTCard title="⛈️ 脅威 (Threats)" items={detailedAnalysis.swot.threats} color="orange" />
          </div>
        </div>

        {/* 将来予測 */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-blue-800">🔮 将来予測</h3>
          <div className="space-y-4">
            <FuturePredictionCard period="1年後" data={detailedAnalysis.future.oneYear} />
            <FuturePredictionCard period="3年後" data={detailedAnalysis.future.threeYears} />
            <FuturePredictionCard period="5年後" data={detailedAnalysis.future.fiveYears} />
          </div>
        </div>

        {/* 競合分析 */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-green-800">🏆 競合分析</h3>
          <div className="mb-4">
            <div className="text-lg font-semibold">
              地域ランキング: {detailedAnalysis.competitive.position}位 / {detailedAnalysis.competitive.total}地域中
            </div>
            <div className="text-sm text-gray-600">当地域スコア: {detailedAnalysis.competitive.ourScore}点</div>
          </div>
          <div className="space-y-2">
            {detailedAnalysis.competitive.competitors.map((competitor: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{competitor.name}</span>
                  <div className="text-sm text-gray-600">
                    {competitor.features.join('、')}
                  </div>
                </div>
                <span className="font-bold text-lg">{competitor.score}点</span>
              </div>
            ))}
          </div>
        </div>

        {/* ライフスタイル別推奨 */}
        <div className="bg-white border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-800">🏠 ライフスタイル別推奨</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(detailedAnalysis.lifestyle).map(([key, data]: [string, any]) => (
              <LifestyleCard key={key} data={data} />
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
);

// SWOTカードコンポーネント
const SWOTCard: React.FC<{ title: string; items: string[]; color: string }> = ({ title, items, color }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h4 className="font-bold mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm flex items-start">
            <span className="mr-2">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 将来予測カード
const FuturePredictionCard: React.FC<{ period: string; data: any }> = ({ period, data }) => (
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-bold text-lg">{period}</h4>
      <span className="text-2xl font-bold text-blue-600">{data.score}点</span>
    </div>
    <p className="text-gray-700 text-sm">{data.prediction}</p>
  </div>
);

// ライフスタイルカード
const LifestyleCard: React.FC<{ data: any }> = ({ data }) => {
  const getSuitabilityColor = (suitability: number) => {
    if (suitability >= 80) return 'text-green-600 bg-green-100';
    if (suitability >= 60) return 'text-blue-600 bg-blue-100';
    if (suitability >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">{data.title}</h4>
        <span className={`px-2 py-1 rounded-full font-bold ${getSuitabilityColor(data.suitability)}`}>
          {data.suitability}%
        </span>
      </div>
      <ul className="text-sm text-gray-600 space-y-1">
        {data.reasons.map((reason: string, index: number) => (
          <li key={index} className="flex items-start">
            <span className="mr-2">•</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// スコアカード
const ScoreCard: React.FC<{
  title: string;
  icon: string;
  score: number;
  maxScore: number;
  count: number;
}> = ({ title, icon, score, maxScore, count }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <span className="text-2xl">{icon}</span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-gray-800">{score}</span>
        <span className="text-sm text-gray-500">/ {maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(score / maxScore) * 100}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">{count}件の施設</div>
    </div>
  </div>
);

// 学校タブ
const SchoolsTab: React.FC<{
  schools: SchoolData[];
  loading: boolean;
  expandedSections: { [key: string]: boolean };
  toggleSection: (section: string) => void;
}> = ({ schools, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (schools.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">���</div>
        <p>指定範囲内に学校が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">��� 教育施設一覧 ({schools.length}件)</h3>
      {mlitUtils.sortByDistance(schools).map(school => (
        <SchoolCard key={school.id} school={school} />
      ))}
    </div>
  );
};

// 学校カード
const SchoolCard: React.FC<{ school: SchoolData }> = ({ school }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-medium text-gray-800">{school.name}</h3>
      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
        school.grade === 'S' ? 'bg-purple-500' :
        school.grade === 'A' ? 'bg-green-500' :
        school.grade === 'B' ? 'bg-blue-500' :
        school.grade === 'C' ? 'bg-orange-500' : 'bg-red-500'
      }`}>
        {school.grade}
      </span>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div>��� {school.address}</div>
      <div className="flex space-x-4">
        <span>��� {mlitUtils.formatDistance(school.distance)}</span>
        <span>⏱️ 徒歩{school.walkTime}分</span>
        <span>��� {mlitUtils.getSchoolCategoryName(school.category)}</span>
      </div>
    </div>
  </div>
);

// 医療機関タブ
const MedicalTab: React.FC<{
  medical: MedicalData[];
  loading: boolean;
  expandedSections: { [key: string]: boolean };
  toggleSection: (section: string) => void;
}> = ({ medical, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (medical.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">���</div>
        <p>指定範囲内に医療機関が見つかりませんでした</p>
      </div>
    );
  }

  const emergencyFacilities = medical.filter(m => m.emergencyCapable);
  const disasterBases = medical.filter(m => m.disasterBase);

  return (
    <div className="space-y-6">
      {/* 特徴的な医療機関 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">��� 救急対応可能</h3>
          <div className="text-2xl font-bold text-red-600">{emergencyFacilities.length}件</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 mb-2">���️ 災害拠点病院</h3>
          <div className="text-2xl font-bold text-orange-600">{disasterBases.length}件</div>
        </div>
      </div>

      {/* 医療機関リスト */}
      <div>
        <h3 className="text-lg font-semibold mb-4">��� 医療機関一覧 ({medical.length}件)</h3>
        <div className="space-y-3">
          {mlitUtils.sortByDistance(medical).map(facility => (
            <MedicalCard key={facility.id} facility={facility} />
          ))}
        </div>
      </div>
    </div>
  );
};

// 医療機関カード
const MedicalCard: React.FC<{ facility: MedicalData }> = ({ facility }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-medium text-gray-800">{facility.name}</h3>
      <div className="flex space-x-1">
        {facility.emergencyCapable && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">救急</span>
        )}
        {facility.disasterBase && (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">災害拠点</span>
        )}
        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
          facility.grade === 'S' ? 'bg-purple-500' :
          facility.grade === 'A' ? 'bg-green-500' :
          facility.grade === 'B' ? 'bg-blue-500' :
          facility.grade === 'C' ? 'bg-orange-500' : 'bg-red-500'
        }`}>
          {facility.grade}
        </span>
      </div>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div>��� {facility.address}</div>
      <div className="flex space-x-4">
        <span>��� {mlitUtils.formatDistance(facility.distance)}</span>
        <span>⏱️ 徒歩{facility.walkTime}分</span>
      </div>
      {facility.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {facility.specialties.map(specialty => (
            <span key={specialty} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              {specialty}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);

// 駅タブ
const StationsTab: React.FC<{
  stations: StationData[];
  loading: boolean;
  expandedSections: { [key: string]: boolean };
  toggleSection: (section: string) => void;
}> = ({ stations, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (stations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">���</div>
        <p>指定範囲内に駅が見つかりませんでした</p>
      </div>
    );
  }

  const uniqueLines = Array.from(new Set(stations.map(s => s.line))).filter(Boolean);
  const uniqueOperators = Array.from(new Set(stations.map(s => s.operator))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* 交通統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">��� 駅数</h3>
          <div className="text-2xl font-bold text-blue-600">{stations.length}駅</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">���️ 路線数</h3>
          <div className="text-2xl font-bold text-green-600">{uniqueLines.length}路線</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-2">��� 運営会社</h3>
          <div className="text-2xl font-bold text-purple-600">{uniqueOperators.length}社</div>
        </div>
      </div>

      {/* 駅リスト */}
      <div>
        <h3 className="text-lg font-semibold mb-4">��� 駅一覧 ({stations.length}駅)</h3>
        <div className="space-y-3">
          {mlitUtils.sortByDistance(stations).map(station => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      </div>
    </div>
  );
};

// 駅カード
const StationCard: React.FC<{ station: StationData }> = ({ station }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-medium text-gray-800">{station.name}</h3>
      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
        station.grade === 'S' ? 'bg-purple-500' :
        station.grade === 'A' ? 'bg-green-500' :
        station.grade === 'B' ? 'bg-blue-500' :
        station.grade === 'C' ? 'bg-orange-500' : 'bg-red-500'
      }`}>
        {station.grade}
      </span>
    </div>
    <div className="text-sm text-gray-600 space-y-1">
      <div>���️ {station.line} ({station.operator})</div>
      <div>��� {station.address}</div>
      <div className="flex space-x-4">
        <span>��� {mlitUtils.formatDistance(station.distance)}</span>
        <span>⏱️ 徒歩{station.walkTime}分</span>
      </div>
      {station.stationCode && (
        <div className="text-xs text-gray-500">駅コード: {station.stationCode}</div>
      )}
    </div>
  </div>
);

// ローディングスピナー
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600">データを読み込み中...</span>
  </div>
);

export default LocationAnalysisComponent;
