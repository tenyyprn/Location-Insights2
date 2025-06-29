"""
アプリケーション設定管理
環境変数とグローバル設定を一元管理
"""
import os
from typing import Optional
from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv()

class Settings:
    """アプリケーション設定クラス"""
    
    # サーバー設定
    PORT: int = int(os.getenv('PORT', 8000))
    HOST: str = os.getenv('HOST', '0.0.0.0')
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # API キー設定
    GOOGLE_MAPS_API_KEY: Optional[str] = os.getenv('GOOGLE_MAPS_API_KEY')
    ESTAT_APP_ID: Optional[str] = os.getenv('ESTAT_APP_ID')
    REAL_ESTATE_LIB_API_KEY: Optional[str] = os.getenv('REACT_APP_REAL_ESTATE_LIB_API_KEY')
    MLIT_API_KEY: Optional[str] = os.getenv('MLIT_API_KEY')
    OPENAI_API_KEY: Optional[str] = os.getenv('OPENAI_API_KEY')
    
    # Google Cloud 設定
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
    GOOGLE_CLOUD_LOCATION: str = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')
    
    # アプリケーション情報
    APP_NAME: str = "Location Insights API"
    APP_VERSION: str = "3.1.8items"
    APP_DESCRIPTION: str = "AIを活用した住環境・不動産分析API"
    
    # CORS設定
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "https://*.herokuapp.com",
        "*"  # 開発環境用（本番では制限を推奨）
    ]
    
    # 検索制限設定
    MAX_SEARCH_RADIUS: int = 5000  # メートル
    DEFAULT_SEARCH_RADIUS: int = 1500
    MAX_FACILITIES_PER_TYPE: int = 50
    
    # スコア計算設定
    SCORE_WEIGHTS: dict = {
        "education": 1.0,
        "medical": 1.0,
        "transport": 1.0,
        "shopping": 1.0,
        "dining": 1.0,
        "safety": 1.2,  # 安全性は少し重み付け
        "environment": 1.0,
        "cultural": 0.8
    }
    
    @property
    def api_keys_configured(self) -> dict:
        """API キーの設定状況を返す"""
        return {
            "google_maps": bool(self.GOOGLE_MAPS_API_KEY),
            "estat": bool(self.ESTAT_APP_ID),
            "real_estate_lib": bool(self.REAL_ESTATE_LIB_API_KEY),
            "mlit_api": bool(self.MLIT_API_KEY),
            "openai": bool(self.OPENAI_API_KEY),
            "vertex_ai": bool(self.GOOGLE_CLOUD_PROJECT_ID)
        }
    
    @property
    def data_mode(self) -> str:
        """データモードを返す（実データ or モックデータ）"""
        return "real_data" if self.MLIT_API_KEY else "mock_data"
    
    def validate_required_keys(self) -> list:
        """必須APIキーの不足をチェック"""
        missing_keys = []
        
        if not self.GOOGLE_MAPS_API_KEY:
            missing_keys.append("GOOGLE_MAPS_API_KEY")
        
        # 他の必須キーがあれば追加
        
        return missing_keys

# グローバル設定インスタンス
settings = Settings()
