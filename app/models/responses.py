"""
レスポンスデータモデル
APIエンドポイントから返すデータの定義
"""
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

class HealthCheckResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    status: str
    message: str
    version: str
    timestamp: str
    apis_available: Dict[str, bool]
    data_mode: str
    
class FacilityInfo(BaseModel):
    """施設情報モデル"""
    name: str
    distance: int
    place_id: Optional[str] = ""
    rating: float = 0.0
    types: List[str] = []
    category: Optional[str] = ""

class ScoreBreakdown(BaseModel):
    """スコア内訳モデル"""
    education: float
    medical: float
    transport: float
    shopping: float
    dining: float
    safety: float
    environment: float
    cultural: float

class LifestyleScores(BaseModel):
    """ライフスタイルスコアモデル"""
    total_score: float
    grade: str
    breakdown: ScoreBreakdown

class FacilityDetails(BaseModel):
    """施設詳細モデル"""
    total_facilities: int
    facilities_list: List[FacilityInfo]

class AllFacilityDetails(BaseModel):
    """全施設詳細モデル"""
    education: FacilityDetails
    medical: FacilityDetails
    transport: FacilityDetails
    shopping: FacilityDetails
    dining: FacilityDetails
    safety: FacilityDetails
    environment: FacilityDetails
    cultural: FacilityDetails

class LifestyleAnalysis(BaseModel):
    """ライフスタイル分析結果モデル"""
    lifestyle_scores: LifestyleScores
    facility_details: AllFacilityDetails

class LifestyleAnalysisResponse(BaseModel):
    """ライフスタイル分析レスポンス"""
    address: str
    coordinates: Dict[str, float]
    items_analyzed: int
    api_version: str
    feature: str
    lifestyle_analysis: LifestyleAnalysis
    
class AIAnalysisResponse(BaseModel):
    """AI分析レスポンス"""
    address: str
    ai_analysis: str
    ai_provider: str
    model: str
    total_score: float
    scores_breakdown: Dict[str, float]

class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    error: str
    message: str
    detail: Optional[str] = None
    timestamp: str = datetime.now().isoformat()
