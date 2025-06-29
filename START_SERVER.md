# Location Insights バックエンド起動ガイド

## 🚀 サーバー起動方法

### 1. 環境確認
```bash
cd C:\Users\tenyy\Downloads\location-insights7
```

### 2. 必要な依存関係のインストール
```bash
pip install fastapi uvicorn python-dotenv
```

### 3. サーバー起動
```bash
python main_chat_only.py
```

### 4. 起動確認
- API健康状態チェック: http://localhost:8002/api/health
- WebSocket接続: ws://localhost:8002/ws/chat/session_id
- ライフスタイル分析API: http://localhost:8002/api/lifestyle-analysis-8items

## ⚙️ 設定情報

### ポート設定
- **フロントエンド**: localhost:3000
- **バックエンド**: localhost:8002

### 環境変数（.env）
```
SERVER_PORT=8002
GOOGLE_MAPS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

## 🔧 トラブルシューティング

### よくあるエラー

1. **ポート8002が使用中**
   ```bash
   netstat -ano | findstr :8002
   taskkill /PID <PID番号> /F
   ```

2. **依存関係エラー**
   ```bash
   pip install -r requirements.txt
   ```

3. **WebSocket接続エラー**
   - バックエンドが起動しているか確認
   - ファイアウォール設定確認
   - ポート番号の一致確認

## 📊 API エンドポイント

### ライフスタイル分析
```
POST /api/lifestyle-analysis-8items
Content-Type: application/json

{
  "address": "東京都渋谷区"
}
```

### ヘルスチェック
```
GET /api/health
```

### WebSocket チャット
```
ws://localhost:8002/ws/chat/{session_id}
```

## 🔄 再起動手順

1. 現在のサーバーを停止（Ctrl+C）
2. ファイルを修正
3. `python main_chat_only.py` で再起動

サーバーが正常に起動すると以下のメッセージが表示されます：
```
🌐 Server starting at: http://localhost:8002
💬 チャット機能WebSocketエンドポイントを追加しました
🔗 WebSocket URL: ws://localhost:8002/ws/chat/{session_id}
```
