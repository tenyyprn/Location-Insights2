import React, { useState, useEffect } from 'react';
import TrendChart from './charts/TrendChart';
import AnalysisCard from './cards/AnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from './ui';

const Dashboard: React.FC = () => {
  const [analysisData, setAnalysisData] = useState({
    totalAnalyses: 42,
    averageScore: 78.5,
    recentAnalyses: []
  });

  const [marketTrends, setMarketTrends] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 実際のAPIエンドポイントがまだない場合はダミーデータを使用
        const dummyData = {
          totalAnalyses: 42,
          averageScore: 78.5,
          recentAnalyses: []
        };
        setAnalysisData(dummyData);
      } catch (error) {
        console.error('データ取得エラー:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 bg-[#FFFFFF] dark:bg-[#1F2937]">
      <div className="max-w-[800px] mx-auto space-y-6">
        <Card className="bg-[#FFFFFF] dark:bg-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#1F2937] dark:text-[#F9FAFB]">
              分析結果サマリー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#F3F4F6] dark:bg-[#4B5563]">
                <p className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">総分析件数</p>
                <p className="text-2xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                  {analysisData.totalAnalyses}件
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#F3F4F6] dark:bg-[#4B5563]">
                <p className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">平均スコア</p>
                <p className="text-2xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">
                  {analysisData.averageScore}点
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] dark:bg-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#1F2937] dark:text-[#F9FAFB]">
              市場トレンド
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={{ labels: [], datasets: [] }} />
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] dark:bg-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#1F2937] dark:text-[#F9FAFB]">
              最近の分析履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisData.recentAnalyses.map((analysis, index) => (
                <AnalysisCard key={index} analysis={analysis} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] dark:bg-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#1F2937] dark:text-[#F9FAFB]">
              ユーザー統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#F3F4F6] dark:bg-[#4B5563]">
                <p className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">本日のアクティブユーザー</p>
                <p className="text-2xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">127名</p>
              </div>
              <div className="p-4 rounded-lg bg-[#F3F4F6] dark:bg-[#4B5563]">
                <p className="text-sm text-[#4B5563] dark:text-[#D1D5DB]">平均分析時間</p>
                <p className="text-2xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">2.5分</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;