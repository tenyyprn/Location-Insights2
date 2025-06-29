# Vertex AI Gemini統合サービス
# ハッカソン必須条件: Google Cloud AI技術の利用

import os
import json
from typing import Dict, List, Any, Optional
import logging

# Vertex AI関連のインポート
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, Part
    from vertexai.language_models import TextGenerationModel
    VERTEX_AI_AVAILABLE = True
    print("✅ Vertex AI ライブラリが正常にインポートされました")
except ImportError as e:
    VERTEX_AI_AVAILABLE = False
    print(f"⚠️ Vertex AI ライブラリが見つかりません: {e}")
    print("💡 pip install google-cloud-aiplatform で解決できます")

class VertexAIGeminiService:
    """
    Vertex AI Gemini API統合サービス
    ハッカソン要件: Google Cloud AI技術の活用
    """
    
    def __init__(self):
        self.project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID', 'location-insights-2025')
        self.location = os.getenv('GOOGLE_CLOUD_LOCATION', 'asia-northeast1')
        self.model_name = 'gemini-1.5-flash'  # 最新のGemini model
        
        # Vertex AI初期化
        if VERTEX_AI_AVAILABLE and self.project_id:
            try:
                vertexai.init(project=self.project_id, location=self.location)
                self.model = GenerativeModel(self.model_name)
                self.available = True
                print(f"✅ Vertex AI Gemini初期化成功: {self.model_name}")
                print(f"🔧 プロジェクト: {self.project_id}")
                print(f"🌏 リージョン: {self.location}")
            except Exception as e:
                self.available = False
                print(f"❌ Vertex AI初期化エラー: {e}")
        else:
            self.available = False
            print("⚠️ Vertex AI利用不可")

    async def analyze_lifestyle_with_gemini(
        self, 
        lifestyle_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gemini APIを使用した生活利便性の高度分析
        """
        if not self.available:
            return self._fallback_analysis(lifestyle_data)
        
        try:
            # プロンプト生成
            prompt = self._create_lifestyle_analysis_prompt(lifestyle_data)
            
            # Gemini APIで分析実行
            response = self.model.generate_content(prompt)
            
            # レスポンス解析
            analysis_result = self._parse_gemini_response(response.text)
            
            return {
                'success': True,
                'analysis': analysis_result,
                'model_used': self.model_name,
                'provider': 'Vertex AI Gemini',
                'confidence': 0.95
            }
            
        except Exception as e:
            print(f"❌ Gemini分析エラー: {e}")
            return self._fallback_analysis(lifestyle_data)

    def _create_lifestyle_analysis_prompt(self, data: Dict[str, Any]) -> str:
        """
        生活利便性分析用のプロンプト生成
        """
        address = data.get('address', '不明な住所')
        scores = data.get('scores', {})
        
        prompt = f"""
あなたは不動産・地域分析の専門家です。以下の住所の生活利便性データを分析し、詳細な評価を行ってください。

📍 分析対象住所: {address}

📊 各項目スコア (100点満点):
- 教育環境: {scores.get('education', 0)}点
- 医療アクセス: {scores.get('medical', 0)}点  
- 交通利便性: {scores.get('transport', 0)}点
- 買い物利便性: {scores.get('shopping', 0)}点
- 飲食環境: {scores.get('dining', 0)}点
- 安全性: {scores.get('safety', 0)}点
- 環境・快適性: {scores.get('environment', 0)}点
- 文化・娯楽: {scores.get('cultural', 0)}点

以下の形式でJSON形式の分析結果を生成してください:

{{
  "overall_evaluation": "総合的な地域評価（200文字程度）",
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["弱み1", "弱み2"],
  "opportunities": ["将来性1", "将来性2"],
  "threats": ["リスク1", "リスク2"],
  "lifestyle_recommendations": {{
    "families": "ファミリー世帯への推奨",
    "singles": "単身者への推奨", 
    "seniors": "シニア世帯への推奨",
    "professionals": "ビジネスパーソンへの推奨"
  }},
  "investment_perspective": "不動産投資観点からの評価",
  "five_year_outlook": "5年後の地域予測"
}}

専門的で具体的な分析を行い、データに基づいた客観的な評価をお願いします。
"""
        return prompt

    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """
        Geminiのレスポンスを解析してJSONに変換
        """
        try:
            # JSON部分を抽出
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group()
                return json.loads(json_text)
            else:
                # JSONが見つからない場合は文章を構造化
                return {
                    "