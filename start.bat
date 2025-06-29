@echo off
echo 🚀 Location Insights を起動中...

:: バックエンドサーバーを起動（ポート5000に明示的に指定）
echo 🐍 バックエンドサーバーを起動中（ポート5000）...
start "Backend Server - Port 5000" cmd /k "set PORT=5000 && python main_original.py"

:: 少し待ってからフロントエンドを起動
timeout /t 5 /nobreak >nul

echo ⚛️ フロントエンドサーバーを起動中（ポート3000）...
cd frontend
start "Frontend Server - Port 3000" cmd /k npm start

cd ..

echo.
echo 🎉 アプリケーションが起動しました！
echo.
echo 🌐 アクセス先:
echo    📱 メインアプリ: http://localhost:3000
echo    🔧 API: http://localhost:5000
echo    📚 APIドキュメント: http://localhost:5000/docs
echo.
echo ⏹️ 停止するには各ウィンドウでCtrl+Cを押してください
echo.
pause