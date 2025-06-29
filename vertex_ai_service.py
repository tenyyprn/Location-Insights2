"""
Vertex AI 実装とテスト用エンドポイント
"""
import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

# 安全なVertex AIインポート
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel
    VERTEX_AI_AVAILABLE = True
except ImportError:
    vertexai = None
    GenerativeModel = None
    VERTEX_AI_AVAILABLE = False

logger = logging.getLogger(__name__)

# 環境変数
PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
LOCATION = os.getenv('GOOGLE_CLOUD_LOCATION', 'asia-northeast1')

# Vertex AI初期化
if PROJECT_ID and VERTEX_AI_AVAILABLE:
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        logger.info(f"✅ Vertex AI 初期化成功: {PROJECT_ID}")
    except Exception as e:
        logger.error(f"⚠️ Vertex AI 初期化失敗: {e}")
        VERTEX_AI_AVAILABLE = False

router = APIRouter()

class VertexAIRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

class VertexAIResponse(BaseModel):
    response: str
    model: str
    status: str

async def generate_with_vertex_ai(
    prompt: str, 
    max_tokens: int = 1000, 
    temperature: float = 0.7
) -> str:
    """Vertex AIでテキスト生成"""
    try:
        if not VERTEX_AI_AVAILABLE:
            return "Vertex AIが利用できません。ライブラリをインストールしてください。"
        
        model = GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": max_tokens,
                "temperature": temperature,
                "top_p": 0.8,
                "top_k": 40
            }
        )
        return response.text
    except Exception as e:
        logger.error(f"Vertex AI生成エラー: {e}")
        return f"AI生成エラー: {str(e)}"

@router.post("/api/vertex-ai/generate", response_model=VertexAIResponse)
async def vertex_ai_generate(request: VertexAIRequest):
    """Vertex AIテキスト生成エンドポイント"""
    try:
        if not VERTEX_AI_AVAILABLE:
            raise HTTPException(
                status_code=503, 
                detail="Vertex AIライブラリがインストールされていません"
            )
        
        if not PROJECT_ID:
            raise HTTPException(
                status_code=500, 
                detail="Google Cloud Project IDが設定されていません"
            )
        
        response_text = await generate_with_vertex_ai(
            request.prompt, 
            request.max_tokens, 
            request.temperature
        )
        
        return VertexAIResponse(
            response=response_text,
            model="gemini-1.5-pro",
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Vertex AI API エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/vertex-ai/status")
async def vertex_ai_status():
    """Vertex AI状態確認"""
    return {
        "vertex_ai_available": VERTEX_AI_AVAILABLE,
        "project_id": PROJECT_ID,
        "location": LOCATION,
        "libraries_installed": {
            "vertexai": vertexai is not None,
            "google_cloud_aiplatform": "google.cloud.aiplatform" in str(vertexai) if vertexai else False
        },
        "status": "ready" if (VERTEX_AI_AVAILABLE and PROJECT_ID) else "configuration_required"
    }

@router.post("/api/vertex-ai/lifestyle-analysis")
async def vertex_ai_lifestyle_analysis(request: Dict[str, Any]):
    """Vertex AIによる住環境分析"""
    try:
        address = request.get("address", "")
        scores = request.get("scores", {})
        facilities = request.get("facilities", {})
        
        # プロンプト生成
        prompt = f"""
以下の住所の住環境について、専門的な分析を行ってください：

住所: {address}

評価スコア:
- 教育: {scores.get('education', 0)}点
- 医療: {scores.get('medical', 0)}点
- 交通: {scores.get('transport', 0)}点
- 買い物: {scores.get('shopping', 0)}点
- 安全: {scores.get('safety', 0)}点
- 環境: {scores.get('environment', 0)}点
- 文化: {scores.get('cultural', 0)}点

以下の観点で分析してください：
1. 総合的な住みやすさ
2. 特に優れている点
3. 改善が望まれる点
4. 推奨される世帯タイプ
5. 投資価値の観点

日本語で自然な文章で回答してください。
"""
        
        analysis = await generate_with_vertex_ai(prompt, max_tokens=1500)
        
        return {
            "address": address,
            "ai_analysis": analysis,
            "scores": scores,
            "provider": "vertex_ai",
            "model": "gemini-1.5-pro"
        }
        
    except Exception as e:
        logger.error(f"Vertex AI住環境分析エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))
