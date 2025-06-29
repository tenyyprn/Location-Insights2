"""
チャットサービス - Location Insights AI応答生成 (Vertex AI版)
"""
import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
import json

# Vertex AI関連のインポート（修正版）
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    VERTEX_AI_AVAILABLE = True
    print("✅ Vertex AI ライブラリ正常インポート完了")
except ImportError as e:
    print(f"❌ Vertex AI インポートエラー: {e}")
    print("💡 解決策: pip install google-cloud-aiplatform --upgrade")
    VERTEX_AI_AVAILABLE = False
    vertexai = None
    GenerativeModel = None
    GenerationConfig = None
except Exception as e:
    print(f"❌ Vertex AI 予期しないエラー: {e}")
    VERTEX_AI_AVAILABLE = False
    vertexai = None
    GenerativeModel = None
    GenerationConfig = None

logger = logging.getLogger(__name__)

class VertexAIChatService:
    """
    Location Insights専用チャットサービス (Vertex AI版)
    地域情報に特化したAI応答を生成
    """
    
    def __init__(self):
        # Vertex AI設定
        self.project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
        self.location = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')
        self.model_name = "gemini-1.5-pro"  # または "gemini-1.5-flash"
        
        # セッション管理
        self.session_contexts: Dict[str, Dict] = {}
        self.session_histories: Dict[str, List[Dict]] = {}
        
        # Vertex AI初期化
        if VERTEX_AI_AVAILABLE and self.project_id:
            try:
                vertexai.init(project=self.project_id, location=self.location)
                self.model = GenerativeModel(self.model_name)
                logger.info(f"✅ Vertex AI初期化成功: {self.project_id}")
            except Exception as e:
                logger.error(f"❌ Vertex AI初期化失敗: {e}")
                self.model = None
        else:
            self.model = None
            logger.warning("⚠️ Vertex AI設定が不完全です")
        
        # システムプロンプト（Location Insights専用）
        self.system_prompt = """あなたは「Location Insights」の地域情報専門AIアシスタントです。

【あなたの役割】
- 日本の地域・住所に関する質問に専門的に回答
- 住環境、生活利便性、安全性、交通アクセスなどを総合的に分析
- ユーザーの住まい選びや地域理解をサポート

【回答スタイル】
- 友好的で親しみやすい口調
- 具体的で実用的な情報を提供
- 必要に応じて絵文字を使用（🏠🚇🏥🏫など）
- 200-400文字程度の適切な長さ

【専門知識】
- 日本全国の交通網、施設情報
- 住環境評価の指標
- 地域の特徴や文化
- 不動産・賃貸市場の傾向

【注意事項】
- 不確実な情報は「推定」「一般的に」などの表現を使用
- 個人の価値観により評価が変わることを考慮
- 最新情報は実際に確認することを推奨

現在分析中の住所やコンテキストがある場合は、それを考慮して回答してください。"""

    async def generate_response(
        self, 
        message: str, 
        session_id: str, 
        context: Optional[Dict] = None
    ) -> str:
        """
        ユーザーメッセージに対するAI応答を生成
        
        Args:
            message: ユーザーのメッセージ
            session_id: セッションID
            context: 追加のコンテキスト情報
            
        Returns:
            AI応答テキスト
        """
        try:
            # セッション履歴を初期化（必要に応じて）
            if session_id not in self.session_histories:
                self.session_histories[session_id] = []
            
            # コンテキストを更新
            if context:
                self.session_contexts[session_id] = context
            
            # 現在のコンテキストを取得
            current_context = self.session_contexts.get(session_id, {})
            
            # Vertex AIが利用可能かチェック
            if not self.model:
                return await self._generate_fallback_response(message, current_context)
            
            # Vertex AIで応答を生成
            return await self._generate_vertex_ai_response(message, session_id, current_context)
            
        except Exception as e:
            logger.error(f"❌ AI応答生成エラー: {e}")
            return await self._generate_fallback_response(message, current_context)
    
    async def _generate_vertex_ai_response(
        self, 
        message: str, 
        session_id: str, 
        context: Dict
    ) -> str:
        """Vertex AIを使用して応答を生成"""
        try:
            # プロンプトを構築
            full_prompt = self._build_full_prompt(message, session_id, context)
            
            # 生成設定
            generation_config = GenerationConfig(
                max_output_tokens=800,
                temperature=0.7,
                top_p=0.8,
                top_k=40
            )
            
            # Vertex AIで生成
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(
                    full_prompt,
                    generation_config=generation_config
                )
            )
            
            ai_response = response.text
            
            # 履歴に追加
            self.session_histories[session_id].extend([
                {"role": "user", "content": message},
                {"role": "assistant", "content": ai_response}
            ])
            
            # 履歴が長くなりすぎた場合は古いものを削除
            if len(self.session_histories[session_id]) > 20:
                self.session_histories[session_id] = self.session_histories[session_id][-20:]
            
            logger.info(f"✅ Vertex AI応答生成成功: session_id={session_id}")
            return ai_response
            
        except Exception as e:
            logger.error(f"❌ Vertex AI API呼び出しエラー: {e}")
            return await self._generate_fallback_response(message, context)
    
    def _build_full_prompt(self, message: str, session_id: str, context: Dict) -> str:
        """完全なプロンプトを構築"""
        prompt_parts = [self.system_prompt]
        
        # コンテキスト情報を追加
        if context:
            context_message = self._build_context_message(context)
            if context_message:
                prompt_parts.append(context_message)
        
        # 会話履歴を追加（最近の5件まで）
        history = self.session_histories[session_id][-10:]
        if history:
            prompt_parts.append("\n【会話履歴】")
            for entry in history:
                role = "ユーザー" if entry["role"] == "user" else "アシスタント"
                prompt_parts.append(f"{role}: {entry['content']}")
        
        # 現在のメッセージを追加
        prompt_parts.append(f"\n【現在の質問】\nユーザー: {message}")
        prompt_parts.append("\nアシスタント:")
        
        return "\n".join(prompt_parts)
    
    async def _generate_fallback_response(self, message: str, context: Dict) -> str:
        """フォールバック応答を生成（Vertex AI利用不可時）"""
        message_lower = message.lower()
        
        # 挨拶や基本的な質問
        if any(word in message_lower for word in ["こんにちは", "はじめまして", "hello", "hi"]):
            return """こんにちは！🏠 Location Insights AI (Vertex AI版) です。
            
地域の住環境や生活利便性について、お気軽にご質問ください。

例えば：
• 「この地域の治安はどうですか？」
• 「最寄りの病院までの距離は？」  
• 「子育てに向いている環境ですか？」

どのようなことが知りたいですか？"""

        # 住所・地域に関する質問
        elif any(word in message_lower for word in ["住所", "地域", "場所", "エリア"]):
            current_address = context.get("address", "")
            if current_address:
                return f"""現在、{current_address}を分析対象に設定しています。🏠

この地域について詳しくお聞かせします。例えば：

🚇 **交通アクセス**: 最寄り駅や主要駅への所要時間
🏥 **医療施設**: 病院やクリニックの充実度  
🏫 **教育環境**: 学校や学習施設の状況
🛒 **生活利便性**: 買い物や飲食店の豊富さ
🛡️ **安全性**: 治安や災害リスク

どの点が気になりますか？"""
            else:
                return """まず分析したい住所を教えてください！📍

住所を設定していただくと、その地域の詳細な情報をお答えできます。

例：「東京都渋谷区神南1-1-1」「大阪市北区梅田1-1-1」など

具体的な住所をお聞かせください。"""

        # 治安・安全性に関する質問
        elif any(word in message_lower for word in ["治安", "安全", "犯罪", "事故"]):
            return """🛡️ この地域の安全性について詳しく分析いたします。

**治安評価の観点：**
• 犯罪発生率（年間統計）
• 警察署・交番までの距離
• 街灯の整備状況
• 地域パトロールの実施状況

**確認できること：**
• 最寄りの警察署・交番の位置
• 緊急時の対応体制
• 地域の防犯対策

より具体的な情報が必要でしたら、詳しくお調べいたします。どの点が特に気になりますか？"""

        # 交通に関する質問
        elif any(word in message_lower for word in ["交通", "駅", "電車", "バス", "アクセス"]):
            return """🚇 交通アクセスについてお答えします。

**調査項目：**
• 最寄り駅までの徒歩時間
• 利用可能な路線と方面
• 主要ターミナル駅への所要時間
• バス路線の充実度

**便利な機能：**
• 通勤ルートのシミュレーション
• 終電時間の確認
• 交通費の概算

どちらの方面への移動が多いですか？具体的な目的地があれば、詳しくルート検索いたします。"""

        # 生活・買い物に関する質問
        elif any(word in message_lower for word in ["買い物", "スーパー", "コンビニ", "商店"]):
            return """🛒 生活利便性について詳しくご案内いたします。

**買い物施設の調査：**
• スーパーマーケットの種類と距離
• コンビニエンスストアの分布
• ショッピングモールへのアクセス
• 専門店や商店街の充実度

**日用品の調達：**
• 食材の買い物（価格帯も含む）
• 日用品・雑貨の購入
• 深夜営業している店舗

具体的にどのような買い物施設を重視されますか？"""

        # 子育て・教育に関する質問
        elif any(word in message_lower for word in ["子育て", "学校", "教育", "保育園", "幼稚園"]):
            return """🏫 子育て・教育環境についてお答えします。

**教育施設の評価：**
• 保育園・幼稚園の待機児童状況
• 小中学校の学区と評判
• 高等学校への進学状況
• 学習塾や習い事の充実度

**子育て支援：**
• 公園や遊び場の安全性
• 小児科医院の分布
• 子育て支援センター
• 地域の子育てコミュニティ

お子様の年齢や、特に重視したい教育方針があれば教えてください。"""

        # 医療に関する質問
        elif any(word in message_lower for word in ["病院", "医療", "クリニック", "薬局"]):
            return """🏥 医療環境について詳しくご案内いたします。

**医療施設の充実度：**
• 総合病院までの距離とアクセス
• 各科専門クリニックの分布
• 救急医療体制の整備状況
• 薬局の営業時間と立地

**特に重要な診療科：**
• 内科・外科（基本的な診療）
• 小児科（お子様がいる場合）
• 産婦人科（女性の健康管理）
• 歯科・眼科（定期的なケア）

何か持病をお持ちでしたり、特に必要な診療科はありますか？"""

        # 一般的な質問への回答
        else:
            return """ご質問をありがとうございます！🏠

Location Insights AI (Vertex AI版) では、以下のような地域情報についてお答えできます：

🏠 **住環境全般**
🚇 **交通アクセス** 
🛡️ **治安・安全性**
🛒 **生活利便性**
🏥 **医療環境**
🏫 **教育環境**
🌳 **自然環境**

より具体的にお聞かせいただければ、詳しい情報をご提供いたします。どのような点が気になりますか？"""

    def _build_context_message(self, context: Dict) -> str:
        """コンテキスト情報からシステムメッセージを構築"""
        context_parts = []
        
        if context.get("address"):
            context_parts.append(f"現在の分析対象住所: {context['address']}")
        
        if context.get("coordinates"):
            coords = context["coordinates"]
            context_parts.append(f"座標: 緯度{coords.get('lat', 0):.4f}, 経度{coords.get('lng', 0):.4f}")
        
        if context.get("lifestyle_scores"):
            scores = context["lifestyle_scores"]
            context_parts.append(f"生活利便性スコア: 総合{scores.get('total_score', 0):.1f}点")
            
            # 個別スコアも追加
            for category, score in scores.get("breakdown", {}).items():
                category_names = {
                    "education": "教育", "medical": "医療", "transport": "交通",
                    "shopping": "買い物", "dining": "飲食", "safety": "安全性", 
                    "environment": "環境", "cultural": "文化"
                }
                if category in category_names:
                    context_parts.append(f"{category_names[category]}: {score:.1f}点")
        
        if context.get("recent_analysis"):
            context_parts.append("最近実行された分析データを参考にして回答してください。")
        
        if context_parts:
            return "【現在のコンテキスト情報】\n" + "\n".join(context_parts) + "\n\nこの情報を踏まえて回答してください。"
        
        return ""
    
    async def update_session_context(self, session_id: str, context: Dict):
        """セッションのコンテキストを更新"""
        self.session_contexts[session_id] = context
        logger.info(f"📝 セッションコンテキスト更新: session_id={session_id}")
    
    def get_session_history(self, session_id: str) -> List[Dict]:
        """セッションの会話履歴を取得"""
        return self.session_histories.get(session_id, [])
    
    def clear_session_history(self, session_id: str):
        """セッションの会話履歴をクリア"""
        if session_id in self.session_histories:
            del self.session_histories[session_id]
        if session_id in self.session_contexts:
            del self.session_contexts[session_id]
        logger.info(f"🗑️ セッション履歴クリア: session_id={session_id}")

    def get_model_info(self) -> Dict:
        """モデル情報を取得"""
        return {
            "provider": "vertex_ai",
            "model": self.model_name,
            "project_id": self.project_id,
            "location": self.location,
            "available": bool(self.model),
            "service": "Vertex AI Generative AI"
        }
