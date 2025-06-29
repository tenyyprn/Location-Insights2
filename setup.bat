@echo off
echo 🚀 Location Insights セットアップ開始...

:: Node.js のバージョンチェック
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js がインストールされていません。Node.js 18以上をインストールしてください。
    pause
    exit /b 1
)

:: Python のバージョンチェック
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python がインストールされていません。Python 3.8以上をインストールしてください。
    pause
    exit /b 1
)

echo ✅ Node.js と Python が確認できました。

:: フロントエンドの依存関係をインストール
echo 📦 フロントエンドの依存関係をインストール中...
if exist "frontend" (
    cd frontend
    npm install
    cd ..
) else (
    echo ❌ frontend ディレクトリが見つかりません。
    pause
    exit /b 1
)

:: Pythonの依存関係をインストール
echo 🐍 Pythonの依存関係をインストール中...
if exist "requirements.txt" (
    pip install -r requirements.txt
) else (
    echo ❌ requirements.txt が見つかりません。
    pause
    exit /b 1
)

:: 環境ファイルの作成
if not exist ".env" (
    echo 📄 環境ファイル(.env^)を作成中...
    (
        echo # Google Maps API Key (オプション^)
        echo REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
        echo.
        echo # OpenAI API Key (オプション^)
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo.
        echo # e-Stat App ID (オプション^)
        echo ESTAT_APP_ID=your_estat_app_id_here
        echo.
        echo # サーバー設定
        echo PORT=5000
        echo FRONTEND_PORT=3000
    ) > .env
    echo ✅ .env ファイルを作成しました。必要に応じてAPIキーを設定してください。
) else (
    echo ✅ .env ファイルが既に存在します。
)

echo.
echo 🎉 セットアップが完了しました！
echo.
echo 📋 次のステップ:
echo 1. .\start.bat を実行してアプリケーションを起動
echo 2. ブラウザで http://localhost:3000 にアクセス
echo 3. API機能を使用する場合は .env ファイルにAPIキーを設定
echo.
pause