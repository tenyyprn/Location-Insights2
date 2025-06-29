import React from 'react';

interface PopulationStatsProps {
  stats: {
    totalPopulation: number;
    ageGroups: { [key: string]: number };
    populationDensity: number;
    trends: { year: string; population: number }[];
  };
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  theme?: 'light' | 'dark';
}

export const PopulationStats: React.FC<PopulationStatsProps> = ({ 
  stats, 
  location, 
  theme = 'light' 
}) => {
  const cardBgColor = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const subtextColor = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const borderColor = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const accentBgColor = theme === 'light' ? 'bg-blue-50' : 'bg-blue-900';
  const accentTextColor = theme === 'light' ? 'text-blue-900' : 'text-blue-100';

  // 人口増減率を計算
  const populationGrowthRate = stats.trends.length >= 2 
    ? ((stats.trends[stats.trends.length - 1].population - stats.trends[0].population) / stats.trends[0].population * 100)
    : 0;

  // 年齢別構成比を計算
  const totalAgePopulation = Object.values(stats.ageGroups).reduce((sum, count) => sum + count, 0);
  const ageRatios = Object.entries(stats.ageGroups).reduce((acc, [key, value]) => {
    acc[key] = totalAgePopulation > 0 ? (value / totalAgePopulation * 100) : 0;
    return acc;
  }, {} as { [key: string]: number });

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(num));
  };

  const formatPercent = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className={`${cardBgColor} rounded-lg shadow-md border ${borderColor}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${textColor}`}>
            人口統計サマリー
          </h2>
          <div className={`${accentBgColor} px-4 py-2 rounded-lg`}>
            <span className={`text-sm font-medium ${accentTextColor}`}>
              📍 {location.name}
            </span>
          </div>
        </div>

        {/* メトリクスカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 総人口 */}
          <div className={`p-4 rounded-lg border ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
            <div className={`text-sm font-medium ${subtextColor} mb-1`}>
              総人口（推計）
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>
              {formatNumber(stats.totalPopulation)}
            </div>
            <div className={`text-xs ${subtextColor}`}>
              人
            </div>
          </div>

          {/* 人口密度 */}
          <div className={`p-4 rounded-lg border ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
            <div className={`text-sm font-medium ${subtextColor} mb-1`}>
              人口密度
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>
              {formatNumber(stats.populationDensity)}
            </div>
            <div className={`text-xs ${subtextColor}`}>
              人/km²
            </div>
          </div>

          {/* 人口増減率 */}
          <div className={`p-4 rounded-lg border ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
            <div className={`text-sm font-medium ${subtextColor} mb-1`}>
              人口増減率
            </div>
            <div className={`text-2xl font-bold ${
              populationGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {populationGrowthRate >= 0 ? '+' : ''}{formatPercent(populationGrowthRate)}
            </div>
            <div className={`text-xs ${subtextColor}`}>
              {stats.trends.length >= 2 
                ? `${stats.trends[0].year}年-${stats.trends[stats.trends.length - 1].year}年`
                : '期間不明'
              }
            </div>
          </div>

          {/* 高齢化率 */}
          <div className={`p-4 rounded-lg border ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
            <div className={`text-sm font-medium ${subtextColor} mb-1`}>
              高齢化率
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>
              {formatPercent(ageRatios['65+'] || 0)}
            </div>
            <div className={`text-xs ${subtextColor}`}>
              65歳以上人口比率
            </div>
          </div>
        </div>

        {/* 年齢構成 */}
        <div className="mb-6">
          <h3 className={`text-lg font-semibold ${textColor} mb-4`}>
            年齢構成
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(ageRatios).map(([ageGroup, ratio]) => {
              const population = stats.ageGroups[ageGroup] || 0;
              const getAgeGroupName = (group: string) => {
                switch (group) {
                  case '0-14': return '年少人口 (0-14歳)';
                  case '15-64': return '生産年齢人口 (15-64歳)';
                  case '65+': return '高齢者人口 (65歳以上)';
                  case '75+': return '後期高齢者 (75歳以上)';
                  case '80+': return '超高齢者 (80歳以上)';
                  default: return group;
                }
              };

              const getAgeGroupColor = (group: string) => {
                switch (group) {
                  case '0-14': return theme === 'light' ? 'bg-green-100 text-green-800' : 'bg-green-900 text-green-200';
                  case '15-64': return theme === 'light' ? 'bg-blue-100 text-blue-800' : 'bg-blue-900 text-blue-200';
                  case '65+': return theme === 'light' ? 'bg-orange-100 text-orange-800' : 'bg-orange-900 text-orange-200';
                  case '75+': return theme === 'light' ? 'bg-red-100 text-red-800' : 'bg-red-900 text-red-200';
                  case '80+': return theme === 'light' ? 'bg-purple-100 text-purple-800' : 'bg-purple-900 text-purple-200';
                  default: return theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-900 text-gray-200';
                }
              };

              return (
                <div key={ageGroup} className={`p-4 rounded-lg ${getAgeGroupColor(ageGroup)}`}>
                  <div className="text-sm font-medium mb-2">
                    {getAgeGroupName(ageGroup)}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-lg font-bold">
                        {formatNumber(population)}人
                      </div>
                      <div className="text-sm opacity-75">
                        {formatPercent(ratio)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-16 bg-current opacity-20 rounded-full h-2 mb-1">
                        <div 
                          className="bg-current rounded-full h-2 transition-all duration-300"
                          style={{ width: `${Math.min(ratio, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 人口推移トレンド（簡易版） */}
        {stats.trends.length > 0 && (
          <div>
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>
              人口推移トレンド
            </h3>
            <div className={`p-4 rounded-lg border ${borderColor} ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className={`text-sm ${subtextColor}`}>
                    {stats.trends[0]?.year}年
                  </div>
                  <div className={`text-xl font-bold ${textColor}`}>
                    {formatNumber(stats.trends[0]?.population || 0)}人
                  </div>
                </div>
                <div className="flex-1 mx-4">
                  <div className={`h-1 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'} rounded-full relative`}>
                    <div 
                      className={`h-1 rounded-full transition-all duration-500 ${
                        populationGrowthRate >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className={`text-center text-sm ${subtextColor} mt-2`}>
                    {populationGrowthRate >= 0 ? '↗️ 増加' : '↘️ 減少'}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm ${subtextColor}`}>
                    {stats.trends[stats.trends.length - 1]?.year}年
                  </div>
                  <div className={`text-xl font-bold ${textColor}`}>
                    {formatNumber(stats.trends[stats.trends.length - 1]?.population || 0)}人
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopulationStats;
