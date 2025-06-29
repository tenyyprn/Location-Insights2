import { useState, useCallback } from 'react';

interface AnalysisResult {
  propertyScore: number;
  locationScore: number;
  investmentScore: number;
  marketScore: number;
  grade: string;
  details: {
    location: {
      transportation: number;
      facilities: number;
      safety: number;
      potential: number;
    };
    investment: {
      yield: number;
      priceValidity: number;
      liquidity: number;
    };
    market: {
      demand: number;
      priceTrend: number;
      areaGrowth: number;
    };
  };
}

interface PropertyData {
  propertyType: string;
  size: number;
  location: string;
  price: number;
  estimatedRent: number;
}

interface AnalysisError {
  message: string;
  code: string;
}

const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [cache, setCache] = useState<Map<string, AnalysisResult>>(new Map());

  const analyzeProperty = useCallback(async (propertyData: PropertyData) => {
    const cacheKey = JSON.stringify(propertyData);
    
    if (cache.has(cacheKey)) {
      setResult(cache.get(cacheKey)!);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('apiToken')}`
        },
        body: JSON.stringify(propertyData)
      });

      if (!response.ok) {
        throw new Error(`分析に失敗しました: ${response.statusText}`);
      }

      const analysisResult = await response.json();
      setResult(analysisResult);
      setCache(new Map(cache.set(cacheKey, analysisResult)));

    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : '不明なエラーが発生しました',
        code: 'ANALYSIS_ERROR'
      });
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    analyzeProperty,
    loading,
    error,
    result,
    clearCache,
    resetAnalysis
  };
};

export default useAnalysis;