import React, { useState } from 'react';
import { LifestyleAnalysisResult } from '../../services/apiService';

interface ResidentAnalysisProps {
  analysisData: LifestyleAnalysisResult;
}

type ResidentType = '20代単身ビジネスパーソン' | '30代共働き夫婦（子なし）' | '30代子育て世帯（未就学児）' | '50代夫婦（子ども独立後）';

interface ResidentProfile {
  icon: string;
  priority: string[];
  strengths: string[];
  concerns: string[];
  advice: string[];
  suitability: number;
}

const ResidentAnalysis: React.FC<ResidentAnalysisProps> = ({ analysisData }) => {
  const [selectedResident, setSelectedResident] = useState<ResidentType>('20代単身ビジネスパーソン');

  // 安全なスコア取得関数
  const getScore = (category: string): number => {
    try {
      const breakdown = analysisData?.lifestyle_analysis?.lifestyle_scores?.breakdown;
      if (!breakdown || typeof breakdown !== 'object') return 0;
      
      // カテゴリ名の正規化とアクセス
      const score = (breakdown as any)[category]?.score;
      return typeof score === 'number' ? score : 0;
    } catch (error) {
      console.warn(`Score access error for ${category}:`, error);
      return 0;
    }
  };

  const scores = {
    safety: getScore('safety'),
    transport: getScore('transport'),
    shopping: getScore('shopping'),
    dining: getScore('dining'),
    medical: getScore('medical'),
    education: getScore('education'),
    environment: getScore('environment'),
    cultural: getScore('cultural')
  };

  // 住民属性別プロファイル生成
  const generateResidentProfiles = (): Record<ResidentType, ResidentProfile> => {
    return {
      "20代単身ビジネスパーソン": {
        icon: '👤',
        priority: ["交通利便性", "買い物利便性", "飲食店"],
        strengths: [
          `交通利便性${scores.transport}点で通勤・移動が便利`,
          `買い物利便性${scores.shopping}点で日常生活が快適`,
          `飲食店${scores.dining}点で外食選択肢が${scores.dining >= 80 ? '豊富' : '確保'}`
        ],
        concerns: [
          scores.safety < 70 ? "夜間の安全性に注意が必要" : "",
          scores.environment < 70 ? "騒音・人混みによるストレス" : ""
        ].filter(Boolean),
        advice: [
          "安全な帰宅ルートを事前に確認",
          scores.environment >= 70 ? "静かな環境を活用してリモートワーク" : "防音対策を検討",
          "週末は静かなエリアでリフレッシュ"
        ],
        suitability: Math.round((scores.transport * 0.25 + scores.shopping * 0.2 + scores.dining * 0.15 + scores.environment * 0.15 + scores.safety * 0.15 + scores.medical * 0.1))
      },
      "30代共働き夫婦（子なし）": {
        icon: '👥',
        priority: ["交通利便性", "買い物利便性", "医療・福祉"],
        strengths: [
          `交通利便性${scores.transport}点で共働きに便利`,
          `買い物利便性${scores.shopping}点で時短買い物が可能`,
          `飲食店${scores.dining}点で外食・デリバリーが${scores.dining >= 80 ? '充実' : '利用可能'}`
        ],
        concerns: [
          scores.education < 70 ? "将来の子育て環境の検討が必要" : "",
          scores.environment < 70 ? "静かな時間の確保が課題" : ""
        ].filter(Boolean),
        advice: [
          "ネットスーパー・宅配サービス活用",
          "平日夜の外食・デリバリー利用",
          scores.education >= 70 ? "将来の子育て環境も良好" : "将来の子育て環境も事前リサーチ"
        ],
        suitability: Math.round((scores.transport * 0.22 + scores.shopping * 0.2 + scores.dining * 0.18 + scores.medical * 0.15 + scores.safety * 0.15 + scores.environment * 0.1))
      },
      "30代子育て世帯（未就学児）": {
        icon: '👶',
        priority: ["安全性", "教育環境", "医療・福祉"],
        strengths: [
          `教育環境${scores.education}点で子育て選択肢が${scores.education >= 80 ? '豊富' : '確保'}`,
          `医療・福祉${scores.medical}点で小児科アクセス${scores.medical >= 80 ? '良好' : 'あり'}`,
          `安全性${scores.safety}点で子どもの安全${scores.safety >= 80 ? '確保' : '対策可能'}`
        ],
        concerns: [
          scores.safety < 80 ? "子どもの安全面でより注意が必要" : "",
          scores.education < 70 ? "教育選択肢の事前調査が必要" : ""
        ].filter(Boolean),
        advice: [
          "保育園・幼稚園の早期情報収集",
          "安全な散歩・遊歩道ルート確認",
          "緊急時の医療機関連絡先整備"
        ],
        suitability: Math.round((scores.safety * 0.3 + scores.education * 0.25 + scores.medical * 0.2 + scores.environment * 0.15 + scores.transport * 0.1))
      },
      "50代夫婦（子ども独立後）": {
        icon: '❤️',
        priority: ["医療・福祉", "環境・快適性", "交通利便性"],
        strengths: [
          `医療・福祉${scores.medical}点で健康管理に${scores.medical >= 80 ? '安心' : '対応可能'}`,
          `交通利便性${scores.transport}点で移動が${scores.transport >= 80 ? '楽' : '可能'}`,
          scores.shopping >= 80 ? "都市部の文化・芸術施設が豊富" : "生活利便施設への一定のアクセス"
        ],
        concerns: [
          scores.environment < 70 ? "騒音による生活品質低下" : "",
          scores.shopping < 70 ? "日常の買い物にやや不便" : ""
        ].filter(Boolean),
        advice: [
          "静かなカフェ・図書館の活用",
          "定期健康チェックアップ体制構築",
          scores.environment >= 70 ? "静かな環境での趣味活動" : "騒音対策と時間帯調整"
        ],
        suitability: Math.round((scores.medical * 0.3 + scores.environment * 0.25 + scores.transport * 0.15 + scores.safety * 0.1 + scores.shopping * 0.1 + scores.cultural * 0.1))
      }
    };
  };

  const residentProfiles = generateResidentProfiles();
  const currentProfile = residentProfiles[selectedResident];

  return (
    <div style={{
      background: 'white',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      marginBottom: '30px'
    }}>
      <h3 style={{ 
        color: '#2c3e50', 
        fontSize: '1.5rem', 
        marginBottom: '20px', 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        👥 居住者属性別分析
      </h3>

      {/* 属性選択 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        {(Object.keys(residentProfiles) as ResidentType[]).map((profile) => (
          <button
            key={profile}
            onClick={() => setSelectedResident(profile)}
            style={{
              padding: '15px',
              border: selectedResident === profile ? '2px solid #667eea' : '2px solid #e9ecef',
              borderRadius: '12px',
              background: selectedResident === profile ? '#f8f9ff' : 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              if (selectedResident !== profile) {
                e.currentTarget.style.borderColor = '#ced4da';
                e.currentTarget.style.background = '#f8f9fa';
              }
            }}
            onMouseOut={(e) => {
              if (selectedResident !== profile) {
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>{residentProfiles[profile].icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2c3e50' }}>
                {profile}
              </span>
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: selectedResident === profile ? '#667eea' : '#666',
              fontWeight: 600
            }}>
              適合度: {residentProfiles[profile].suitability}%
            </div>
          </button>
        ))}
      </div>

      {/* 詳細分析表示 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '25px',
        borderRadius: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>{currentProfile.icon}</span>
            <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>
              {selectedResident}
            </h4>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: 700
          }}>
            適合度: {currentProfile.suitability}%
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {/* 強み */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h5 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 600 }}>
              ✅ この地域の強み
            </h5>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
              {currentProfile.strengths.map((strength, index) => (
                <li key={index} style={{ marginBottom: '8px', fontSize: '0.95rem' }}>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* アドバイス */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h5 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 600 }}>
              💡 生活アドバイス
            </h5>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
              {currentProfile.advice.map((advice, index) => (
                <li key={index} style={{ marginBottom: '8px', fontSize: '0.95rem' }}>
                  {advice}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 注意点（ある場合のみ） */}
        {currentProfile.concerns.length > 0 && (
          <div style={{
            marginTop: '20px',
            background: 'rgba(255, 193, 7, 0.2)',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 193, 7, 0.5)'
          }}>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 600 }}>
              ⚠️ 注意すべき点
            </h5>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
              {currentProfile.concerns.map((concern, index) => (
                <li key={index} style={{ marginBottom: '5px', fontSize: '0.9rem' }}>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 優先項目表示 */}
        <div style={{
          marginTop: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '15px',
          borderRadius: '10px'
        }}>
          <h5 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 600 }}>
            🎯 重視するポイント
          </h5>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px' 
          }}>
            {currentProfile.priority.map((priority, index) => (
              <span key={index} style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                {priority}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentAnalysis;