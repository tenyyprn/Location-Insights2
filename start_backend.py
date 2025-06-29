#!/usr/bin/env python3
"""
Location Insights バックエンドサーバー起動スクリプト
"""

import os
import sys
import uvicorn
from pathlib import Path

def main():
    # 環境変数の設定
    os.environ['PORT'] = '5000'
    os.environ['HOST'] = '0.0.0.0'
    
    print("🚀 Location Insights バックエンドサーバーを起動中...")
    print(f"📂 作業ディレクトリ: {os.getcwd()}")
    print(f"🐍 Python: {sys.version}")
    print(f"🌐 ポート: 5000")
    print(f"🔗 URL: http://localhost:5000")
    print(f"📚 APIドキュメント: http://localhost:5000/docs")
    print("=" * 50)
    
    try:
        # main_original.pyが存在するか確認
        main_file = Path("main_original.py")
        if not main_file.exists():
            print("❌ main_original.py が見つかりません")
            return
        
        # FastAPIアプリを起動
        uvicorn.run(
            "main_original:app",
            host="0.0.0.0",
            port=5000,
            reload=False,
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ サーバー起動エラー: {e}")
        print("🔧 依存関係を確認してください: pip install -r requirements.txt")

if __name__ == "__main__":
    main()
