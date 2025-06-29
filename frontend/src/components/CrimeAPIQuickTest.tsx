import React, { useState } from 'react';

// 犯罪統計API簡易テストコンポーネント
const CrimeAPIQuickTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runAPITest = async () => {
    setLoading(true);
    setTestResults([]);
    
    const API_KEY = process.env.REACT_APP_ESTAT_APP_ID || 'c69b4c4005fedb14afb9cf497b7e2dd505c189bc';
    const results: any[] = [];

    // テスト1: e-Stat API 犯罪統計
    try {
      results.push({ test: 'e-Stat API 犯罪統計', status: 'testing...', data: null });
      setTestResults([...results]);

      const url = new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');
      url.searchParams.append('appId', API_KEY);
      url.searchParams.append('statsDataId', '0003195003');
      url.searchParams.append('cdArea', '13000');
      url.searchParams.append('cdTime', '2023000000-2024000000');
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        const values = data?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
        
        results[results.length - 1] = {
          test: 'e-Stat API 犯罪統計',
          status: '✅ 成功',
          data: values ? `データ ${values.length}件取得` : 'データなし',
          sample: values?.[0] || null
        };
      } else {
        results[results.length - 1] = {
          test: 'e-Stat API 犯罪統計',
          status: '❌ 失敗',
          data: `HTTP ${response.status}`,
          error: response.statusText
        };
      }
    } catch (error) {
      results[results.length - 1] = {
        test: 'e-Stat API 犯罪統計',
        status: '❌ エラー',
        data: 'ネットワークエラー',
        error: String(error)
      };
    }

    setTestResults([...results]);

    // テスト2: 東京都オープンデータ
    try {
      results.push({ test: '東京都オープンデータ', status: 'testing...', data: null });
      setTestResults([...results]);

      const tokyoResponse = await fetch(
        'https://catalog.data.metro.tokyo.lg.jp/api/3/action/datastore_search?resource_id=t000022d0000000033&limit=5'
      );
      
      if (tokyoResponse.ok) {
        const tokyoData = await tokyoResponse.json();
        const records = tokyoData?.result?.records;
        
        results[results.length - 1] = {
          test: '東京都オープンデータ',
          status: '✅ 成功',
          data: records ? `犯罪データ ${records.length}件取得` : 'データなし',
          sample: records?.[0] || null
        };
      } else {
        results[results.length - 1] = {
          test: '東京都オープンデータ',
          status: '❌ 失敗',
          data: `HTTP ${tokyoResponse.status}`,
          error: tokyoResponse.statusText
        };
      }
    } catch (error) {
      results[results.length - 1] = {
        test: '東京都オープンデータ',
        status: '❌ エラー',
        data: 'ネットワークエラー',
        error: String(error)
      };
    }

    setTestResults([...results]);

    // テスト3: 交通事故統計
    try {
      results.push({ test: '交通事故統計', status: 'testing...', data: null });
      setTestResults([...results]);

      const trafficUrl = new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');
      trafficUrl.searchParams.append('appId', API_KEY);
      trafficUrl.searchParams.append('statsDataId', '0003348001');
      trafficUrl.searchParams.append('cdArea', '13000');
      trafficUrl.searchParams.append('cdTime', '2023000000-2024000000');
      
      const trafficResponse = await fetch(trafficUrl.toString());
      
      if (trafficResponse.ok) {
        const trafficData = await trafficResponse.json();
        const trafficValues = trafficData?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
        
        results[results.length - 1] = {
          test: '交通事故統計',
          status: '✅ 成功',
          data: trafficValues ? `事故データ ${trafficValues.length}件取得` : 'データなし',
          sample: trafficValues?.[0] || null
        };
      } else {
        results[results.length - 1] = {
          test: '交通事故統計',
          status: '❌ 失敗',
          data: `HTTP ${trafficResponse.status}`,
          error: trafficResponse.statusText
        };
      }
    } catch (error) {
      results[results.length - 1] = {
        test: '交通事故統計',
        status: '❌ エラー',
        data: 'ネットワークエラー',
        error: String(error)
      };
    }

    setTestResults([...results]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        padding: '24px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#374151',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center'
        }}>
          🚓 犯罪統計API接続テスト
        </h2>
        
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={runAPITest}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: loading ? '#9ca3af' : '#ef4444',
              boxShadow: loading ? 'none' : '0 4px 8px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '🔄 テスト実行中...' : '🚀 API接続テスト開始'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                borderRadius: '8px',
                borderLeft: '4px solid',
                borderLeftColor: result.status.includes('✅') 
                  ? '#10b981' 
                  : result.status.includes('❌')
                  ? '#ef4444'
                  : '#f59e0b',
                backgroundColor: result.status.includes('✅') 
                  ? '#f0fdf4' 
                  : result.status.includes('❌')
                  ? '#fef2f2'
                  : '#fefce8'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>{result.test}</h3>
                  <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                    <span style={{ fontWeight: '500' }}>ステータス: </span>
                    <span>{result.status}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                    <span style={{ fontWeight: '500' }}>結果: </span>
                    <span>{result.data}</span>
                  </div>
                  {result.error && (
                    <div style={{ fontSize: '0.875rem', marginTop: '4px', color: '#dc2626' }}>
                      <span style={{ fontWeight: '500' }}>エラー: </span>
                      <span>{result.error}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {result.sample && (
                <details style={{ marginTop: '12px' }}>
                  <summary style={{
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#2563eb'
                  }}>
                    サンプルデータを表示
                  </summary>
                  <pre style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(result.sample, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {testResults.length > 0 && !loading && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#dbeafe',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>📊 テスト結果サマリー</h4>
            <div style={{ fontSize: '0.875rem', color: '#1d4ed8' }}>
              <div>成功: {testResults.filter(r => r.status.includes('✅')).length}件</div>
              <div>失敗: {testResults.filter(r => r.status.includes('❌')).length}件</div>
              <div>合計: {testResults.length}件</div>
            </div>
            
            {testResults.every(r => r.status.includes('✅')) && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#dcfce7',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#166534', fontWeight: '600' }}>🎉 全てのAPIテストが成功しました！</div>
                <div style={{ color: '#15803d', fontSize: '0.875rem', marginTop: '4px' }}>
                  犯罪統計API機能の実装準備が整いました。
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>🔧 API設定情報</h4>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            <div style={{ marginBottom: '4px' }}>APIキー: {process.env.REACT_APP_ESTAT_APP_ID ? `${process.env.REACT_APP_ESTAT_APP_ID.substring(0, 8)}...` : '未設定'}</div>
            <div style={{ marginBottom: '4px' }}>e-Stat API: 犯罪統計・交通事故統計</div>
            <div>東京都オープンデータ: リアルタイム犯罪情報</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrimeAPIQuickTest;