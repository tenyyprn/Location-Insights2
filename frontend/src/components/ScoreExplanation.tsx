import React from 'react';

interface ScoreExplanationProps {
  analysisData: any;
}

const ScoreExplanation: React.FC<ScoreExplanationProps> = ({ analysisData }) => {
  if (!analysisData?.lifestyle_analysis?.lifestyle_scores?.breakdown) {
    return (
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          🔍 スコア詳細分析
        </h3>
        <p style={{ color: '#666' }}>
          分析データが取得できませんでした。住所を分析してから再度お試しください。
        </p>
      </div>
    );
  }

  const breakdown = analysisData.lifestyle_analysis.lifestyle_scores.breakdown;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 70) return '#8BC34A';
    if (score >= 60) return '#FFC107';
    if (score >= 50) return '#FF9800';
    return '#F44336';
  };

  const getScoreDescription = (score: number): string => {
    if (score >= 90) return '優秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '普通';
    if (score >= 60) return '要改善';
    return '改善必要';
  };

  const explanations: { [key: string]: { title: string; description: string; factors: string[]; calculation: string; } } = {
    safety: {
      title: '🛡️ 安全性',
      description: '犯罪統計、交番・警察署の密度、街灯整備状況から総合評価',
      factors: [
        '近隣交番・警察署数: 緊急時の対応速度に影響',
        '犯罪発生率: 過去の統計データから安全度を評価',
        '街灯・照明: 夜間の安全性を左右する重要要素',
        '地域防犯活動: コミュニティの安全意識レベル'
      ],
      calculation: '各要素を20-30%の重みで総合計算。交番密度40%、犯罪統計30%、街灯品質30%'
    },
    transport: {
      title: '🚇 交通利便性',
      description: '最寄り駅までの距離、路線数、バス停アクセス性を評価',
      factors: [
        '最寄り駅距離: 300m以内(100点)、500m以内(80点)、1km以内(60点)',
        '利用可能路線数: 複数路線利用可能性でボーナス加点',
        'バス停アクセス: 200m以内のバス停数で利便性評価',
        '交通機関の運行頻度: ピーク時・オフピーク時の運行本数'
      ],
      calculation: '駅距離70% + バス利便性30%。徒歩5分以内で大幅加点'
    },
    shopping: {
      title: '🛒 買い物利便性',
      description: 'スーパー、コンビニ、ショッピングモール等の買い物施設へのアクセス性を評価',
      factors: [
        'スーパーマーケット: 400m以内(90点)、800m以内(70点)',
        'コンビニエンスストア: 500m圏内の店舗数で評価',
        'ショッピングモール: 大型商業施設へのアクセス性',
        '商店街・個人店: 地域密着型店舗の充実度',
        'ドラッグストア: 日用品購入の利便性'
      ],
      calculation: 'スーパー40% + コンビニ30% + 商業施設多様性30%'
    },
    dining: {
      title: '🍽️ 飲食利便性',
      description: 'レストラン、カフェ、飲食店等の外食施設へのアクセス性を評価',
      factors: [
        'レストラン: 多様なジャンルの飲食店の充実度',
        'カフェ・喫茶店: くつろぎ・作業空間としての利便性',
        'ファミリーレストラン: 家族向け外食の選択肢',
        'ファストフード: 手軽な食事の利便性',
        '弁当・総菜店: テイクアウト需要への対応'
      ],
      calculation: '多様性40% + アクセス性30% + 価格帯バランス30%'
    },
    medical: {
      title: '🏥 医療施設',
      description: '病院、クリニック、薬局等の医療インフラ充実度',
      factors: [
        '総合病院: 2km以内の大病院存在で安心度向上',
        'クリニック・診療所: 1km圏内の医療機関密度',
        '薬局・ドラッグストア: 300m圏内の薬局アクセス',
        '専門医療機関: 歯科、眼科等の専門医療の充実'
      ],
      calculation: '病院40% + クリニック40% + 薬局20%で総合評価'
    },
    education: {
      title: '🎓 教育環境',
      description: '学校、図書館、学習塾等の教育施設への近さと質',
      factors: [
        '小学校: 800m以内で通学安全性評価',
        '中学校: 1.5km以内のアクセス性',
        '高等学校: 3km圏内の選択肢の多さ',
        '図書館: 知的活動拠点としての利用しやすさ',
        '学習塾・予備校: 教育サポート環境の充実度'
      ],
      calculation: '学校距離60% + 教育施設多様性40%で算出'
    },
    environment: {
      title: '🌳 自然・環境',
      description: '公園、緑地、川や山などの自然環境の豊かさ',
      factors: [
        '近隣公園: 300m圏内の公園面積と設備',
        '緑地帯: 住宅地の緑化率と街路樹の充実',
        '水辺環境: 川、池、海などの親水空間',
        '山地・丘陵: 自然散策やハイキングスポット',
        '空気品質: 大気汚染レベルと環境基準達成度'
      ],
      calculation: '公園50% + 緑地30% + 自然景観20%'
    },
    cultural: {
      title: '🎨 文化・娯楽',
      description: '文化施設、娯楽施設、スポーツ施設等の充実度',
      factors: [
        '文化施設: 美術館、博物館、劇場等へのアクセス',
        'スポーツ施設: 体育館、プール、テニスコート等',
        '娯楽施設: 映画館、ゲームセンター、カラオケ等',
        'イベント会場: コンサートホール、多目的ホール',
        '祭り・地域行事: 地域文化活動の活発度'
      ],
      calculation: '施設多様性50% + アクセス性30% + 活動頻度20%'
    }
  };

  const itemMapping: { [key: string]: string } = {
    safety: 'safety',
    transport: 'transport', 
    shopping: 'shopping',
    dining: 'dining',
    medical: 'medical',
    education: 'education',
    environment: 'environment',
    cultural: 'cultural'
  };

  const getImprovementSuggestions = (category: string, score: number): string[] => {
    if (score >= 80) return [`${explanations[category]?.title || category}は既に高水準です`];

    const suggestions: { [key: string]: string[] } = {
      safety: [
        '近隣の交番や警察署の位置を確認し、緊急連絡先を把握する',
        '地域の防犯パトロールや見守り活動への参加を検討',
        '防犯カメラ設置の有無や街灯の明るさを確認',
        '近隣住民とのコミュニケーションを深めて地域連携を強化'
      ],
      transport: [
        '最寄り駅までの最短ルートを複数確認',
        'バス路線やタクシー利用方法を調査',
        '自転車やバイクでの移動手段を検討',
        '定期券の最適な購入方法を確認'
      ],
      shopping: [
        '大型スーパーやショッピングモールへのアクセス方法を確認',
        'オンラインショッピングの活用を検討',
        '地域の商店街や直売所の利用を検討',
        '配送サービスや宅配ボックスの活用'
      ],
      dining: [
        'デリバリーサービスの利用可能範囲を確認',
        '近隣の飲食店情報をアプリで収集',
        '地域の食堂や隠れた名店を探索',
        '料理スキルを向上させて自炊の充実を図る'
      ],
      medical: [
        '最寄りの総合病院と専門クリニックを事前に調査',
        '緊急時の医療機関アクセス方法を確認',
        'かかりつけ医の確保と定期健診の受診',
        '救急車要請時の住所と目印を明確にしておく'
      ],
      education: [
        '図書館や学習施設の利用方法を確認',
        'オンライン学習環境の整備',
        '地域の教育イベントや講座への参加',
        '子供がいる場合は学区情報の詳細確認'
      ],
      environment: [
        '近隣公園や緑地の散策ルートを開拓',
        '少し離れた自然スポットへのアクセス方法を調査',
        'ガーデニングやベランダ菜園で緑を増やす',
        '自然系の趣味やアクティビティを始める'
      ],
      cultural: [
        '近隣の文化施設の割引制度や会員制度を確認',
        '地域イベントや祭りの情報収集',
        'オンラインでの文化コンテンツ利用',
        '趣味サークルやクラブ活動への参加'
      ]
    };

    return suggestions[category] || ['該当する改善提案が見つかりません'];
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '15px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      padding: '30px',
      marginTop: '30px'
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '25px',
        textAlign: 'center'
      }}>
        🔍 スコア詳細分析
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '25px'
      }}>
        {Object.entries(explanations).map(([key, explanation]) => {
          const scoreData = breakdown[itemMapping[key] || key];
          const score = scoreData?.score || 0;
          
          // デバッグ情報をコンソールに出力
          console.log(`ScoreExplanation - ${key}:`, {
            mappedKey: itemMapping[key] || key,
            scoreData,
            score,
            breakdown: breakdown
          });
          
          return (
            <div key={key} style={{
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              padding: '20px',
              background: '#fff'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '15px'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: 0
                }}>
                  {explanation.title}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    backgroundColor: getScoreColor(score)
                  }}>
                    {score.toFixed(1)}点
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    color: score >= 70 ? '#28a745' : score >= 50 ? '#ffc107' : '#dc3545',
                    fontWeight: '600'
                  }}>
                    {getScoreDescription(score)}
                  </span>
                </div>
              </div>
              
              <p style={{
                color: '#6c757d',
                fontSize: '0.9rem',
                marginBottom: '15px',
                lineHeight: 1.5
              }}>
                {explanation.description}
              </p>
              
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{
                  fontWeight: '600',
                  color: '#495057',
                  marginBottom: '10px',
                  fontSize: '1rem'
                }}>
                  評価要素:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {explanation.factors.map((factor, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '5px',
                      fontSize: '0.85rem',
                      color: '#6c757d',
                      lineHeight: 1.4
                    }}>
                      <span style={{
                        color: '#007bff',
                        marginRight: '8px',
                        fontWeight: 'bold'
                      }}>
                        •
                      </span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{
                  fontWeight: '600',
                  color: '#495057',
                  marginBottom: '5px',
                  fontSize: '1rem'
                }}>
                  計算方法:
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#6c757d',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  {explanation.calculation}
                </p>
              </div>
              
              {score < 80 && (
                <div>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#495057',
                    marginBottom: '10px',
                    fontSize: '1rem'
                  }}>
                    改善提案:
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {getImprovementSuggestions(key, score).slice(0, 2).map((suggestion, index) => (
                      <li key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '5px',
                        fontSize: '0.85rem',
                        color: '#6c757d',
                        lineHeight: 1.4
                      }}>
                        <span style={{
                          color: '#28a745',
                          marginRight: '8px',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '12px',
        border: '1px solid #2196f3'
      }}>
        <h3 style={{
          fontWeight: '600',
          color: '#1976d2',
          marginBottom: '10px',
          fontSize: '1.1rem'
        }}>
          💡 総合スコア向上のコツ
        </h3>
        <p style={{
          color: '#1976d2',
          fontSize: '0.9rem',
          margin: 0,
          lineHeight: 1.6
        }}>
          各項目のバランスを考慮し、特に低スコアの項目を重点的に改善することで、
          総合的な住環境満足度を向上させることができます。
          地域の特性を活かしながら、ライフスタイルに合った改善策を選択しましょう。
        </p>
      </div>
    </div>
  );
};

export default ScoreExplanation;