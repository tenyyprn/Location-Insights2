import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  Button
} from '../ui';

interface TrendChartProps {
  data?: any;
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  // モックマーケットデータ
  const marketData = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [{
      label: '平均価格',
      data: [650, 680, 720, 750, 780, 800],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  };

  const handleExport = () => {
    console.log('グラフをエクスポート');
    // エクスポート機能の実装
  };

  return (
    <Card className="w-full bg-[#ffffff] dark:bg-[#1a1a1a]">
      <CardHeader>
        <CardTitle className="text-[#333333] dark:text-[#ffffff]">市場トレンド分析</CardTitle>
        <CardDescription className="text-[#666666] dark:text-[#cccccc]">
          直近6ヶ月の不動産市場動向
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4">
          {/* Chart.jsの代わりにシンプルな表示 */}
          <div className="trend-chart-placeholder">
            <h4>市場価格推移（万円/㎡）</h4>
            <div className="line-chart-mock">
              {marketData.datasets[0].data.map((value, index) => (
                <div key={index} className="data-point">
                  <div className="point-label">{marketData.labels[index]}</div>
                  <div className="point-value">{value}万円</div>
                  <div 
                    className="point-bar"
                    style={{ 
                      height: `${(value / 1000) * 200}px`,
                      backgroundColor: '#4BC0C0'
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleExport}
            className="bg-[#4CAF50] text-white hover:bg-[#45a049]"
          >
            グラフをエクスポート
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export { TrendChart };
export default TrendChart;
