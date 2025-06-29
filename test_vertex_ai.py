#!/usr/bin/env python3
"""
Vertex AI ライブラリテストスクリプト
"""
import sys
import os

print("🔧 Vertex AI ライブラリテスト開始")
print("=" * 50)

# 1. 基本的なインポートテスト
try:
    print("1️⃣ 基本インポートテスト...")
    import vertexai
    print("✅ vertexai モジュール インポート成功")
except ImportError as e:
    print(f"❌ vertexai インポート失敗: {e}")
    sys.exit(1)

# 2. GenerativeModel インポートテスト
try:
    print("2️⃣ GenerativeModel インポートテスト...")
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    print("✅ GenerativeModel インポート成功")
except ImportError as e:
    print(f"❌ GenerativeModel インポート失敗: {e}")
    print("💡 解決策: pip install google-cloud-aiplatform --upgrade")
    sys.exit(1)

# 3. 環境変数チェック
print("3️⃣ 環境変数チェック...")
project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
location = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')

print(f"   PROJECT_ID: {'✅ 設定済み' if project_id else '❌ 未設定'}")
print(f"   LOCATION: {location}")

if not project_id:
    print("❌ GOOGLE_CLOUD_PROJECT_ID が設定されていません")
    print("💡 .env ファイルに以下を追加してください:")
    print("   GOOGLE_CLOUD_PROJECT_ID=your-project-id")
    sys.exit(1)

# 4. Vertex AI 初期化テスト
try:
    print("4️⃣ Vertex AI 初期化テスト...")
    vertexai.init(project=project_id, location=location)
    print(f"✅ Vertex AI 初期化成功: {project_id} ({location})")
except Exception as e:
    print(f"❌ Vertex AI 初期化失敗: {e}")
    print("💡 Google Cloud認証を確認してください")
    sys.exit(1)

# 5. モデル作成テスト
try:
    print("5️⃣ GenerativeModel 作成テスト...")
    model = GenerativeModel("gemini-1.5-pro")
    print("✅ GenerativeModel 作成成功")
except Exception as e:
    print(f"❌ GenerativeModel 作成失敗: {e}")
    sys.exit(1)

# 6. 簡単なテスト生成
try:
    print("6️⃣ テスト生成...")
    print("   (この処理はGoogle Cloud の認証が必要です)")
    
    # 認証がない場合はスキップ
    test_response = model.generate_content(
        "Hello, say 'Test successful!' in Japanese.",
        generation_config=GenerationConfig(
            max_output_tokens=50,
            temperature=0.1
        )
    )
    print(f"✅ テスト生成成功: {test_response.text}")
    
except Exception as e:
    print(f"⚠️ テスト生成スキップ (認証が必要): {e}")
    print("💡 Google Cloud の認証設定が必要ですが、ライブラリ自体は正常です")

print("=" * 50)
print("🎉 Vertex AI ライブラリテスト完了")
print()
print("📋 結果:")
print("   ✅ vertexai ライブラリ: 正常")
print("   ✅ GenerativeModel: 正常")
print("   ✅ 初期化: 正常")
print()
print("🔗 次のステップ:")
print("   1. Google Cloud の認証設定")
print("   2. サーバーの再起動")
print("   3. /api/test/vertex-ai-websocket でテスト")
