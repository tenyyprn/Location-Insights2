import React, { useState } from 'react';
import PropertyForm from './forms/PropertyForm';
import AnalysisChart from './charts/AnalysisChart';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui';

const PropertyAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async (propertyData: any) => {
    setLoading(true);
    try {
      // 仮の分析結果を生成（実際のAPIが完成するまで）
      const mockResult = {
        location: 85,
        building: 78,
        environment: 92,
        price: 75,
        future: 88,
        overall: 83.6
      };
      
      // 実際の分析が実装されるまでの遅延シミュレーション
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnalysisResult(mockResult);
    } catch (error) {
      console.error('分析エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!analysisResult) return;
    const reportData = JSON.stringify(analysisResult, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '物件分析レポート.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-800" style={{ maxWidth: '800px' }}>
      <Card className="mb-8 bg-card">
        <CardHeader className="bg-card">
          <CardTitle className="text-2xl font-bold text-center">不動産物件分析</CardTitle>
          <div className="text-center text-gray-600 dark:text-gray-400">
            物件情報を入力して詳細な分析を実行します
          </div>
        </CardHeader>
        <CardContent className="bg-card">
          <PropertyForm onSubmit={handleAnalysis} />
        </CardContent>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">分析を実行中です...</p>
        </div>
      )}

      {analysisResult && (
        <Card className="mt-8 bg-card">
          <CardHeader className="bg-card">
            <CardTitle>分析結果</CardTitle>
          </CardHeader>
          <CardContent className="bg-card">
            <AnalysisChart data={analysisResult} />
            <div className="mt-8">
              <Button 
                onClick={handleExportReport}
                className="w-full"
              >
                レポートをダウンロード
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyAnalysis;