"""
リクエストデータモデル
APIエンドポイントで受信するデータの定義
"""
from pydantic import BaseModel
from typing import Dict, Any, Optional

class LifestyleAnalysisRequest(BaseModel):
    """ライフスタイル分析リクエスト"""
    address: str
    
    class Config:
        schema_extra = {
            "example": {
                "address": "東京都国分寺市本町2-1-1"
            }
        }

class PropertyPriceRequest(BaseModel):
    """不動産価格分析リクエスト"""
    address: str
    propertyData: Dict[str, Any]
    
    class Config:
        schema_extra = {
            "example": {
                "address": "東京都国分寺市本町2-1-1",
                "propertyData": {
                    "area": 70,
                    "buildingYear": 2010,
                    "propertyType": "apartment"
                }
            }
        }

class IntegratedDataRequest(BaseModel):
    """統合データリクエスト"""
    coordinates: Dict[str, float]
    address: str
    
    class Config:
        schema_extra = {
            "example": {
                "coordinates": {"lat": 35.6995, "lng": 139.4814},
                "address": "東京都国分寺市本町2-1-1"
            }
        }

class AILifestyleAnalysisRequest(BaseModel):
    """AI ライフスタイル分析リクエスト"""
    address: str
    coordinates: Dict[str, float]
    facilityData: Dict[str, Any]
    overallScore: float
    scores: Dict[str, float]
    
    class Config:
        schema_extra = {
            "example": {
                "address": "東京都国分寺市本町2-1-1",
                "coordinates": {"lat": 35.6995, "lng": 139.4814},
                "facilityData": {
                    "education": {"total": 10},
                    "medical": {"total": 15}
                },
                "overallScore": 75.5,
                "scores": {
                    "education": 80.0,
                    "medical": 75.0,
                    "transport": 70.0,
                    "shopping": 85.0,
                    "dining": 75.0,
                    "safety": 80.0,
                    "environment": 70.0,
                    "cultural": 65.0
                }
            }
        }
