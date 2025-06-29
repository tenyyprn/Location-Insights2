#!/bin/bash

echo "🗑️ Location Insights プロジェクトクリーンアップ開始..."
echo ""

# ⚠️ 重要: main_original.py は重要なプログラムのため保護します
echo "⚠️ 重要ファイル保護中: main_original.py は削除しません"

# Phase 1: 重複・旧バージョンファイルの削除（main_original.py除外）
echo "⭐ Phase 1: 重複・旧バージョンファイルの削除"
if [ -f "main_backup.py" ]; then rm "main_backup.py"; fi
if [ -f "main_current_backup.py" ]; then rm "main_current_backup.py"; fi
if [ -f "main_original_tail.py" ]; then rm "main_original_tail.py"; fi
echo "✅ 旧バージョンmainファイル削除完了（main_original.py保護済み）"

# Phase 2: Node.js重複ディレクトリの削除
echo "⭐ Phase 2: Node.js重複ディレクトリの削除"
if [ -d "routes" ]; then rm -rf "routes"; fi
if [ -d "services" ]; then rm -rf "services"; fi
if [ -d "src" ]; then rm -rf "src"; fi
if [ -f "server.js" ]; then rm "server.js"; fi
echo "✅ Node.js重複ディレクトリ削除完了"

# Phase 3: テストファイルの削除
echo "⭐ Phase 3: テストファイルの削除"
if [ -d "test" ]; then rm -rf "test"; fi
if [ -f "check-deployment.js" ]; then rm "check-deployment.js"; fi
if [ -f "check-models.js" ]; then rm "check-models.js"; fi
if [ -f "final-vertex-ai-test.js" ]; then rm "final-vertex-ai-test.js"; fi
if [ -f "test-correct-endpoints.js" ]; then rm "test-correct-endpoints.js"; fi
if [ -f "test-correct-request-format.js" ]; then rm "test-correct-request-format.js"; fi
if [ -f "test-corrected-endpoints.js" ]; then rm "test-corrected-endpoints.js"; fi
if [ -f "test-vertex-ai-endpoint.js" ]; then rm "test-vertex-ai-endpoint.js"; fi
echo "✅ テストファイル削除完了"

# Phase 4: 不要な設定・実行ファイルの削除
echo "⭐ Phase 4: 不要な設定・実行ファイルの削除"
if [ -f "load-env.js" ]; then rm "load-env.js"; fi
if [ -f "nul" ]; then rm "nul"; fi
if [ -f "{" ]; then rm "{"; fi
echo "✅ 不要ファイル削除完了"

# Phase 5: キャッシュ・一時ファイルの削除
echo "⭐ Phase 5: キャッシュ・一時ファイルの削除"
if [ -d "__pycache__" ]; then rm -rf "__pycache__"; fi
echo "✅ キャッシュファイル削除完了"

# 削除後のディレクトリ構造確認
echo ""
echo "📊 削除完了 - 残存ファイル確認:"
ls -la
echo ""
echo "✅ クリーンアップ完了！"
echo ""
echo "🔒 保護された重要ファイル:"
echo "  📁 main_original.py - 重要な機能を含むオリジナルファイル"
echo ""
echo "📁 新しい整理されたプロジェクト構造:"
echo "  ├── app/ (新しいアプリケーション構造)"
echo "  ├── frontend/ (Reactフロントエンド)"
echo "  ├── main.py (現在のメインファイル)"
echo "  ├── main_new.py (リファクタリング版)"
echo "  ├── main_original.py (重要機能付きオリジナル)"
echo "  ├── main_backup_original.py (バックアップ)"
echo "  └── その他の重要ファイル"
echo ""
echo "🎯 次のステップ:"
echo "  1. main_original.py の確認: python main_original.py (ポート8002)"
echo "  2. 通常版の確認: python main.py (ポート8000)"
echo ""
