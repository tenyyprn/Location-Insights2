import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button
} from '../ui';

interface AnalysisCardProps {
  analysis?: {
    location: string;
    grade: string;
    score: number;
    analyzed_at: string;
  };
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  // モックデータ（analysisが渡されない場合）
  const mockAnalysis = {
    location: analysis?.location || "東京都渋谷区",
    grade: analysis?.grade || "A+",
    score: analysis?.score || 92,
    analyzed_at: analysis?.analyzed_at || new Date().toISOString()
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return '#10B981';
      case 'A': return '#3B82F6';
      case 'B+': 
      case 'B': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const getGradeDescription = (grade: string) => {
    switch (grade) {
      case 'A+': return '優秀 - 非常に高い投資価値';
      case 'A': return '良好 - 高い投資価値';
      case 'B+': 
      case 'B': return '平均的 - 適度な投資価値';
      default: return '要検討 - 慎重な判断が必要';
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>
      <Card style={{ backgroundColor: '#F8FAFC' }}>
        <CardHeader>
          <CardTitle style={{ color: '#1E293B' }}>不動産分析結果</CardTitle>
          <CardDescription style={{ color: '#64748B' }}>
            物件の総合評価とキー指標
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#EEF2FF' }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: '#64748B', fontSize: '0.875rem' }}>
                  {mockAnalysis.location}
                </span>
                <span style={{ color: '#64748B', fontSize: '0.875rem' }}>
                  {formatDate(mockAnalysis.analyzed_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="h-5 w-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getGradeColor(mockAnalysis.grade) }}
                >
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    ✓
                  </span>
                </div>
                <span style={{ color: '#1E293B' }}>
                  グレード: {mockAnalysis.grade} ({getGradeDescription(mockAnalysis.grade)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
                  {mockAnalysis.score}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748B' }}>総合スコア</div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#D97706' }}>
                  7.2%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748B' }}>予想利回り</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: '#64748B' }}>立地スコア</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: '85%', backgroundColor: '#10B981' }}
                    ></div>
                  </div>
                  <span style={{ color: '#1E293B', fontWeight: '600' }}>85</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#64748B' }}>投資スコア</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: '78%', backgroundColor: '#3B82F6' }}
                    ></div>
                  </div>
                  <span style={{ color: '#1E293B', fontWeight: '600' }}>78</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#64748B' }}>市場スコア</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: '92%', backgroundColor: '#8B5CF6' }}
                    ></div>
                  </div>
                  <span style={{ color: '#1E293B', fontWeight: '600' }}>92</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                className="w-full" 
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}
                onClick={() => console.log('詳細レポートを表示')}
              >
                詳細レポートを表示
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                style={{ borderColor: '#3B82F6', color: '#3B82F6' }}
                onClick={() => console.log('分析データをダウンロード')}
              >
                分析データをダウンロード
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { AnalysisCard };
export default AnalysisCard;
