import React from 'react';

interface PopulationChartProps {
  data: { year: string; population: number }[];
  ageGroups: { [key: string]: number };
  theme?: 'light' | 'dark';
  loading?: boolean;
}

export const PopulationChart: React.FC<PopulationChartProps> = ({ 
  data, 
  ageGroups, 
  theme = 'light',
  loading = false
}) => {
  const cardBgColor = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtextColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

  if (loading) {
    return (
      <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor} p-6`}>
        <div className="animate-pulse">
          <div className={`h-6 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded mb-4`}></div>
          <div className={`h-64 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded`}></div>
        </div>
      </div>
    );
  }

  // 人口推移グラフのスケーリング
  const maxPopulation = Math.max(...data.map(d => d.population));
  const minPopulation = Math.min(...data.map(d => d.population));
  const populationRange = maxPopulation - minPopulation;

  // 年齢構成円グラフのデータ準備
  const totalAgePopulation = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
  const ageGroupData = Object.entries(ageGroups).map(([key, value]) => ({
    name: key,
    value,
    percentage: totalAgePopulation > 0 ? (value / totalAgePopulation * 100) : 0
  }));

  const ageGroupColors = {
    '0-14': '#10b981', // green
    '15-64': '#3b82f6', // blue
    '65+': '#f59e0b', // amber
    '75+': '#ef4444', // red
    '80+': '#8b5cf6'  // purple
  };

  const getAgeGroupDisplayName = (key: string) => {
    const names = {
      '0-14': '年少人口',
      '15-64': '生産年齢',
      '65+': '高齢者',
      '75+': '後期高齢',
      '80+': '超高齢'
    };
    return names[key as keyof typeof names] || key;
  };

  return (
    <div className="space-y-6">
      {/* 人口推移グラフ */}
      <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor}`}>
        <div className="p-6">
          <h3 className={`text-xl font-semibold ${textColor} mb-4`}>
            人口推移
          </h3>
          
          {data.length > 0 ? (
            <div className="relative">
              {/* SVGグラフ */}
              <svg viewBox="0 0 600 300" className="w-full h-64">
                {/* グリッド線 */}
                <defs>
                  <pattern 
                    id="grid" 
                    width="60" 
                    height="30" 
                    patternUnits="userSpaceOnUse"
                  >
                    <path 
                      d="M 60 0 L 0 0 0 30" 
                      fill="none" 
                      stroke={theme === 'light' ? '#e5e7eb' : '#4b5563'} 
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="600" height="300" fill="url(#grid)" />
                
                {/* 人口推移線 */}
                <path
                  d={data.map((point, index) => {
                    const x = (index / (data.length - 1)) * 580 + 10;
                    const y = populationRange > 0 
                      ? 280 - ((point.population - minPopulation) / populationRange) * 260 + 10
                      : 150;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* データポイント */}
                {data.map((point, index) => {
                  const x = (index / (data.length - 1)) * 580 + 10;
                  const y = populationRange > 0 
                    ? 280 - ((point.population - minPopulation) / populationRange) * 260 + 10
                    : 150;
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* 年度ラベル */}
                      <text
                        x={x}
                        y="295"
                        textAnchor="middle"
                        className={`text-xs ${subtextColor}`}
                        fill="currentColor"
                      >
                        {point.year}
                      </text>
                    </g>
                  );
                })}
                
                {/* Y軸ラベル */}
                <text
                  x="5"
                  y="15"
                  className={`text-xs ${subtextColor}`}
                  fill="currentColor"
                >
                  {Math.round(maxPopulation).toLocaleString()}
                </text>
                <text
                  x="5"
                  y="285"
                  className={`text-xs ${subtextColor}`}
                  fill="currentColor"
                >
                  {Math.round(minPopulation).toLocaleString()}
                </text>
              </svg>
            </div>
          ) : (
            <div className={`text-center py-12 ${subtextColor}`}>
              データがありません
            </div>
          )}
        </div>
      </div>

      {/* 年齢構成グラフ */}
      <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor}`}>
        <div className="p-6">
          <h3 className={`text-xl font-semibold ${textColor} mb-4`}>
            年齢構成
          </h3>
          
          {ageGroupData.length > 0 && totalAgePopulation > 0 ? (
            <div className="space-y-4">
              {/* 横棒グラフ */}
              {ageGroupData
                .filter(item => item.value > 0)
                .sort((a, b) => b.value - a.value)
                .map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${textColor}`}>
                        {getAgeGroupDisplayName(item.name)}
                      </span>
                      <span className={`text-sm ${subtextColor}`}>
                        {item.value.toLocaleString()}人 ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className={`w-full ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-full h-3`}>
                      <div
                        className="h-3 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: ageGroupColors[item.name as keyof typeof ageGroupColors] || '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                ))}
              
              {/* 円グラフ（シンプル版） */}
              <div className="mt-6 flex justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {ageGroupData
                      .filter(item => item.value > 0)
                      .reduce((acc, item, index) => {
                        const angle = (item.percentage / 100) * 360;
                        const startAngle = acc.currentAngle;
                        const endAngle = startAngle + angle;
                        
                        const startX = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                        const startY = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                        const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                        const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M 100 100`,
                          `L ${startX} ${startY}`,
                          `A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                          'Z'
                        ].join(' ');
                        
                        acc.paths.push(
                          <path
                            key={item.name}
                            d={pathData}
                            fill={ageGroupColors[item.name as keyof typeof ageGroupColors] || '#6b7280'}
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                        
                        acc.currentAngle = endAngle;
                        return acc;
                      }, { paths: [] as React.ReactNode[], currentAngle: 0 }).paths
                    }
                  </svg>
                  
                  {/* 中央のテキスト */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${textColor}`}>
                        {totalAgePopulation.toLocaleString()}
                      </div>
                      <div className={`text-xs ${subtextColor}`}>
                        総人口
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 凡例 */}
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                {ageGroupData
                  .filter(item => item.value > 0)
                  .map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ageGroupColors[item.name as keyof typeof ageGroupColors] || '#6b7280' }}
                      />
                      <span className={`text-xs ${subtextColor}`}>
                        {getAgeGroupDisplayName(item.name)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 ${subtextColor}`}>
              年齢構成データがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopulationChart;