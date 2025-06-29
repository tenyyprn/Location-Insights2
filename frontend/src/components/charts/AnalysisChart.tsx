import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../ui';

interface AnalysisChartProps {
  data?: any;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  const [selectedChart, setSelectedChart] = useState<'investment' | 'risk'>('investment');

  // モックデータ
  const investmentData = {
    labels: ['利回り', '価格適正性', '流動性', '成長性', '安定性'],
    datasets: [{
      label: '投資指標',
      data: [80, 75, 85, 70, 90],
      backgroundColor: 'rgba(74, 144, 226, 0.2)',
      borderColor: 'rgba(74, 144, 226, 1)',
      borderWidth: 2
    }]
  };

  const riskData = {
    labels: ['市場リスク', '流動性リスク', '地域リスク', '金利リスク', '管理リスク'],
    datasets: [{
      label: 'リスク評価',
      data: [60, 40, 30, 50, 35],
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2
    }]
  };

  return (
    <Card className="w-full bg-[#ffffff] dark:bg-[#1a1a1a]">
      <CardHeader>
        <CardTitle className="text-[#333333] dark:text-[#ffffff]">分析チャート</CardTitle>
        <CardDescription className="text-[#666666] dark:text-[#cccccc]">
          投資収益性とリスク評価の詳細分析
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="investment" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger
              value="investment"
              onClick={() => setSelectedChart('investment')}
              className="w-1/2"
            >
              投資収益分析
            </TabsTrigger>
            <TabsTrigger
              value="risk"
              onClick={() => setSelectedChart('risk')}
              className="w-1/2"
            >
              リスク評価
            </TabsTrigger>
          </TabsList>
          <TabsContent value="investment" className="mt-4">
            <div className="w-full h-[400px]">
              {/* Chart.jsの代わりにシンプルな表示 */}
              <div className="chart-placeholder">
                <h4>投資収益分析チャート</h4>
                <div className="mock-chart">
                  {investmentData.datasets[0].data.map((value, index) => (
                    <div key={index} className="chart-bar">
                      <span>{investmentData.labels[index]}: {value}%</span>
                      <div 
                        className="bar" 
                        style={{ width: `${value}%`, backgroundColor: '#4A90E2' }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="risk" className="mt-4">
            <div className="w-full h-[400px]">
              <div className="chart-placeholder">
                <h4>リスク評価チャート</h4>
                <div className="mock-chart">
                  {riskData.datasets[0].data.map((value, index) => (
                    <div key={index} className="chart-bar">
                      <span>{riskData.labels[index]}: {value}%</span>
                      <div 
                        className="bar" 
                        style={{ width: `${value}%`, backgroundColor: '#FF6384' }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between bg-[#f5f5f5] dark:bg-[#2a2a2a] p-4">
        <Button variant="outline" className="text-[#333333] dark:text-[#ffffff]">
          データ更新
        </Button>
        <Button className="bg-[#4a90e2] text-[#ffffff]">
          レポート出力
        </Button>
      </CardFooter>
    </Card>
  );
};

export { AnalysisChart };
export default AnalysisChart;
