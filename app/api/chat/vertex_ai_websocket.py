"""
WebSocketエンドポイント for Location Insights チャット機能 (Vertex AI版)
"""
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from typing import Dict, List, Optional
import json
import asyncio
import logging
from datetime import datetime
import uuid
from app.services.vertex_ai_chat_service import VertexAIChatService

logger = logging.getLogger(__name__)

router = APIRouter()

class VertexAIConnectionManager:
    """WebSocket接続管理クラス (Vertex AI版)"""
    
    def __init__(self):
        # アクティブな接続を管理
        self.active_connections: Dict[str, WebSocket] = {}
        # セッションごとのメタデータ
        self.session_metadata: Dict[str, Dict] = {}
        self.chat_service = VertexAIChatService()
    
    async def connect(self, websocket: WebSocket, session_id: str, user_metadata: Optional[Dict] = None):
        """WebSocket接続を確立"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        
        # セッションメタデータを保存
        self.session_metadata[session_id] = {
            "connected_at": datetime.now().isoformat(),
            "user_metadata": user_metadata or {},
            "message_count": 0,
            "ai_model": self.chat_service.get_model_info()
        }
        
        logger.info(f"✅ WebSocket接続確立: session_id={session_id}")
        
        # 接続確認メッセージを送信
        model_info = self.chat_service.get_model_info()
        welcome_message = "Location Insights AI (Vertex AI版) に接続しました。地域についてお気軽にお聞きください！"
        
        if model_info["available"]:
            welcome_message += f"\n🤖 AI: {model_info['model']} (Google Cloud Vertex AI)"
        else:
            welcome_message += "\n⚠️ 現在、基本モードで動作しています。"
        
        await self.send_message(session_id, {
            "type": "system",
            "content": welcome_message,
            "timestamp": datetime.now().isoformat(),
            "model_info": model_info
        })
    
    def disconnect(self, session_id: str):
        """WebSocket接続を切断"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_metadata:
            del self.session_metadata[session_id]
        logger.info(f"❌ WebSocket接続切断: session_id={session_id}")
    
    async def send_message(self, session_id: str, message: Dict):
        """特定のセッションにメッセージを送信"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(
                    json.dumps(message, ensure_ascii=False)
                )
                return True
            except Exception as e:
                logger.error(f"❌ メッセージ送信失敗: {e}")
                self.disconnect(session_id)
                return False
        return False
    
    async def send_typing_indicator(self, session_id: str, is_typing: bool = True):
        """タイピングインジケーターを送信"""
        await self.send_message(session_id, {
            "type": "typing",
            "is_typing": is_typing,
            "timestamp": datetime.now().isoformat()
        })
    
    async def process_user_message(self, session_id: str, message: str, context: Optional[Dict] = None):
        """ユーザーメッセージを処理してAI応答を生成"""
        try:
            # メッセージカウントを更新
            if session_id in self.session_metadata:
                self.session_metadata[session_id]["message_count"] += 1
            
            # タイピングインジケーターを表示
            await self.send_typing_indicator(session_id, True)
            
            # 処理状況メッセージ
            await self.send_message(session_id, {
                "type": "processing",
                "content": "🤖 Vertex AIで回答を生成しています...",
                "timestamp": datetime.now().isoformat()
            })
            
            # AI応答を生成
            ai_response = await self.chat_service.generate_response(
                message=message,
                session_id=session_id,
                context=context
            )
            
            # タイピングインジケーターを非表示
            await self.send_typing_indicator(session_id, False)
            
            # AI応答を送信
            await self.send_message(session_id, {
                "type": "message",
                "role": "assistant",
                "content": ai_response,
                "timestamp": datetime.now().isoformat(),
                "message_id": str(uuid.uuid4()),
                "model_used": self.chat_service.get_model_info()["model"],
                "provider": "vertex_ai"
            })
            
            return ai_response
            
        except Exception as e:
            logger.error(f"❌ メッセージ処理エラー: {e}")
            await self.send_typing_indicator(session_id, False)
            
            # エラーメッセージを送信
            await self.send_message(session_id, {
                "type": "error",
                "content": "申し訳ございません。Vertex AIサービスが一時的に利用できません。しばらく待ってから再度お試しください。",
                "timestamp": datetime.now().isoformat(),
                "error_details": str(e) if logger.level <= logging.DEBUG else None
            })
    
    def get_active_sessions(self) -> Dict[str, Dict]:
        """アクティブなセッション情報を取得"""
        return {
            session_id: {
                "metadata": self.session_metadata.get(session_id, {}),
                "connected": session_id in self.active_connections
            }
            for session_id in self.session_metadata
        }

# グローバルな接続マネージャー (Vertex AI版)
vertex_ai_manager = VertexAIConnectionManager()

@router.websocket("/ws/chat/{session_id}")
async def websocket_vertex_ai_chat_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocketチャットエンドポイント (Vertex AI版)
    
    Args:
        websocket: WebSocket接続
        session_id: セッションID（ユニーク識別子）
    """
    try:
        # 接続を確立
        await vertex_ai_manager.connect(websocket, session_id)
        
        # メッセージループ
        while True:
            try:
                # クライアントからメッセージを受信
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                logger.info(f"📨 Vertex AI受信メッセージ: session_id={session_id}, type={message_data.get('type')}")
                
                if message_data.get("type") == "message":
                    # ユーザーメッセージを処理
                    user_message = message_data.get("content", "")
                    context = message_data.get("context", {})
                    
                    if user_message.strip():
                        # ユーザーメッセージをエコーバック
                        await vertex_ai_manager.send_message(session_id, {
                            "type": "message",
                            "role": "user",
                            "content": user_message,
                            "timestamp": datetime.now().isoformat(),
                            "message_id": str(uuid.uuid4())
                        })
                        
                        # AI応答を生成・送信
                        await vertex_ai_manager.process_user_message(session_id, user_message, context)
                
                elif message_data.get("type") == "ping":
                    # ヘルスチェック
                    await vertex_ai_manager.send_message(session_id, {
                        "type": "pong",
                        "timestamp": datetime.now().isoformat(),
                        "service": "vertex_ai_chat"
                    })
                
                elif message_data.get("type") == "context_update":
                    # コンテキスト更新（住所変更など）
                    context = message_data.get("context", {})
                    await vertex_ai_manager.chat_service.update_session_context(session_id, context)
                    
                    await vertex_ai_manager.send_message(session_id, {
                        "type": "context_updated",
                        "content": f"分析対象を{context.get('address', '不明')}に設定しました。🏠",
                        "timestamp": datetime.now().isoformat()
                    })
                
                elif message_data.get("type") == "model_info":
                    # モデル情報要求
                    model_info = vertex_ai_manager.chat_service.get_model_info()
                    await vertex_ai_manager.send_message(session_id, {
                        "type": "model_info_response",
                        "model_info": model_info,
                        "timestamp": datetime.now().isoformat()
                    })
                    
            except WebSocketDisconnect:
                logger.info(f"🔌 Vertex AI WebSocket切断: session_id={session_id}")
                break
            except json.JSONDecodeError:
                logger.error(f"❌ 無効なJSONメッセージ: session_id={session_id}")
                await vertex_ai_manager.send_message(session_id, {
                    "type": "error",
                    "content": "無効なメッセージ形式です。",
                    "timestamp": datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"❌ Vertex AIメッセージ処理エラー: {e}")
                await vertex_ai_manager.send_message(session_id, {
                    "type": "error", 
                    "content": "メッセージの処理中にエラーが発生しました。",
                    "timestamp": datetime.now().isoformat()
                })
                
    except Exception as e:
        logger.error(f"❌ Vertex AI WebSocket接続エラー: {e}")
    finally:
        # 接続をクリーンアップ
        vertex_ai_manager.disconnect(session_id)

@router.get("/api/chat/vertex-ai/sessions")
async def get_vertex_ai_active_sessions():
    """Vertex AIアクティブなチャットセッション一覧を取得"""
    return {
        "service": "vertex_ai_chat",
        "active_sessions": vertex_ai_manager.get_active_sessions(),
        "total_connections": len(vertex_ai_manager.active_connections),
        "model_info": vertex_ai_manager.chat_service.get_model_info()
    }

@router.post("/api/chat/vertex-ai/sessions/{session_id}/context")
async def update_vertex_ai_session_context(session_id: str, context: Dict):
    """Vertex AIセッションのコンテキストを更新"""
    if session_id in vertex_ai_manager.active_connections:
        await vertex_ai_manager.chat_service.update_session_context(session_id, context)
        return {
            "status": "success", 
            "message": "Vertex AIコンテキストが更新されました",
            "service": "vertex_ai_chat"
        }
    else:
        return {
            "status": "error", 
            "message": "Vertex AIセッションが見つかりません"
        }

@router.get("/api/chat/vertex-ai/model-info")
async def get_vertex_ai_model_info():
    """Vertex AIモデル情報を取得"""
    return vertex_ai_manager.chat_service.get_model_info()
