"""
Real Estate Library API 実装
"""
import os
import logging
import aiohttp
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# 環境変数
REAL_ESTATE_LIB_API_KEY = os.getenv('REAL_ESTATE_LIB_API_KEY')

router = APIRouter()

class RealEstateSearchRequest(BaseModel):
    address: str
    property_type: Optional[str] = "all"
    price_range: Optional[Dict[str, int]] = None
    area_range: Optional[Dict[str, float]] = None

class RealEstateResponse(BaseModel):
    properties: List[Dict[str, Any]]
    total_count: int
    average_price: Optional[float]
    status: str

async def search_real_estate_properties(
    session: aiohttp.ClientSession,
    address: str,
    property_type: str = "all",
    api_key: str = None
) -> Dict[str, Any]:
    """不動産物件検索（Real Estate Lib API）"""
    
    if not api_key:
        logger.warning("⚠️ Real Estate Lib APIキーが設定されていません")
        return {
            "properties": [],
            "total_count": 0,
            "average_price": 0,
            "status": "api_key_required",
            "message": "Real Estate Library APIキーが必要です"
        }
    
    # 実際のAPIエンドポイント（仮想）
    url = "https://api.real-estate-lib.com/v1/properties/search"
    
    params = {
        "address": address,
        "type": property_type,
        "format": "json"
    }
    
    # 🆕 複数の認証ヘッダー形式に対応
    headers = {
        # Azure API Management形式
        "Ocp-Apim-Subscription-Key": api_key,
        # Bearer Token形式（フォールバック）
        "Authorization": f"Bearer {api_key}",
        # APIキー形式（フォールバック）
        "X-API-Key": api_key,
        "Content-Type": "application/json",
        "User-Agent": "LocationInsights/1.0",
        "Accept": "application/json"
    }
    
    try:
        async with session.get(url, params=params, headers=headers, timeout=30) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "properties": data.get("properties", []),
                    "total_count": data.get("total", 0),
                    "average_price": data.get("average_price"),
                    "status": "success",
                    "auth_method": "ocp_apim_subscription_key"
                }
            elif response.status == 401:
                return {
                    "properties": [],
                    "total_count": 0,
                    "status": "unauthorized",
                    "message": "APIキーが無効です（Ocp-Apim-Subscription-Key形式を使用）"
                }
            elif response.status == 403:
                return {
                    "properties": [],
                    "total_count": 0,
                    "status": "forbidden",
                    "message": "アクセスが拒否されました。サブスクリプションキーを確認してください"
                }
            else:
                return {
                    "properties": [],
                    "total_count": 0,
                    "status": "error",
                    "message": f"API Error: {response.status}"
                }
                
    except Exception as e:
        logger.error(f"Real Estate Lib API エラー: {e}")
        return {
            "properties": [],
            "total_count": 0,
            "status": "error",
            "message": str(e)
        }

def generate_mock_real_estate_data(address: str) -> Dict[str, Any]:
    """モック不動産データ生成（APIが利用できない場合）"""
    import random
    
    mock_properties = []
    
    # ランダムな物件データ生成
    for i in range(5):
        property_data = {
            "id": f"prop_{i+1}",
            "address": f"{address}周辺の物件{i+1}",
            "price": random.randint(3000, 8000) * 10000,  # 3000万〜8000万
            "area": random.randint(60, 120),  # 60〜120㎡
            "building_year": random.randint(2000, 2023),
            "floor_plan": random.choice(["2LDK", "3LDK", "4LDK"]),
            "property_type": random.choice(["マンション", "戸建て"]),
            "distance_to_station": random.randint(3, 15),  # 駅徒歩3〜15分
            "price_per_sqm": 0
        }
        
        # 平米単価計算
        property_data["price_per_sqm"] = int(property_data["price"] / property_data["area"])
        mock_properties.append(property_data)
    
    # 平均価格計算
    average_price = sum(p["price"] for p in mock_properties) / len(mock_properties)
    
    return {
        "properties": mock_properties,
        "total_count": len(mock_properties),
        "average_price": average_price,
        "status": "mock_data",
        "message": "モックデータを表示中（Real Estate Lib API未設定）"
    }

@router.post("/api/real-estate/search", response_model=RealEstateResponse)
async def search_real_estate(request: RealEstateSearchRequest):
    """不動産物件検索エンドポイント"""
    try:
        if not REAL_ESTATE_LIB_API_KEY or REAL_ESTATE_LIB_API_KEY == "your_real_estate_lib_api_key_here":
            # APIキーが設定されていない場合はモックデータを返す
            mock_data = generate_mock_real_estate_data(request.address)
            return RealEstateResponse(
                properties=mock_data["properties"],
                total_count=mock_data["total_count"],
                average_price=mock_data["average_price"],
                status=mock_data["status"]
            )
        
        async with aiohttp.ClientSession() as session:
            result = await search_real_estate_properties(
                session,
                request.address,
                request.property_type,
                REAL_ESTATE_LIB_API_KEY
            )
            
            return RealEstateResponse(
                properties=result["properties"],
                total_count=result["total_count"],
                average_price=result.get("average_price"),
                status=result["status"]
            )
            
    except Exception as e:
        logger.error(f"不動産検索エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/real-estate/status")
async def real_estate_api_status():
    """Real Estate Lib API状態確認"""
    return {
        "api_key_configured": bool(REAL_ESTATE_LIB_API_KEY and REAL_ESTATE_LIB_API_KEY != "your_real_estate_lib_api_key_here"),
        "api_key_length": len(REAL_ESTATE_LIB_API_KEY) if REAL_ESTATE_LIB_API_KEY else 0,
        "status": "ready" if (REAL_ESTATE_LIB_API_KEY and REAL_ESTATE_LIB_API_KEY != "your_real_estate_lib_api_key_here") else "configuration_required",
        "mock_data_available": True,
        "supported_features": [
            "物件検索",
            "価格分析",
            "地域比較",
            "投資価値評価"
        ]
    }

@router.get("/api/real-estate/market-analysis/{address}")
async def market_analysis(address: str):
    """地域市場分析"""
    try:
        # 市場分析データ生成（実際のAPIまたはモック）
        if not REAL_ESTATE_LIB_API_KEY or REAL_ESTATE_LIB_API_KEY == "your_real_estate_lib_api_key_here":
            # モック市場分析データ
            import random
            
            return {
                "address": address,
                "market_trend": random.choice(["上昇", "安定", "下降"]),
                "average_price_per_sqm": random.randint(400000, 800000),
                "price_change_1year": random.randint(-10, 15),
                "liquidity_score": random.randint(60, 90),
                "investment_rating": random.choice(["A", "B+", "B", "C+"]),
                "comparable_areas": [
                    f"{address}周辺エリア1",
                    f"{address}周辺エリア2",
                    f"{address}周辺エリア3"
                ],
                "status": "mock_data"
            }
        
        # 実際のAPI実装はここに追加
        return {
            "address": address,
            "status": "api_implementation_required",
            "message": "Real Estate Lib APIの実装が必要です"
        }
        
    except Exception as e:
        logger.error(f"市場分析エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))
