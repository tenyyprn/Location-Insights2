#!/bin/bash

echo "🔧 Google Cloud ライブラリのインストール中..."
cd C:/Users/tenyy/Downloads/location-insights4

# Google Cloudライブラリをインストール
pip install google-cloud-aiplatform vertexai python-dotenv

echo "✅ インストール完了"
echo ""
echo "🚀 サーバーを起動しています..."
python main_fixed.py
