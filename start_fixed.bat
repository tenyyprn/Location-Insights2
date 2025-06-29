@echo off
chcp 65001 >nul
echo Starting Location Insights...

echo Starting Backend Server (Port 5000)...
start "Backend Server - Port 5000" cmd /k "set PORT=5000 && python main_original.py"

echo Waiting 5 seconds...
ping localhost -n 6 >nul

echo Starting Frontend Server (Port 3000)...
cd frontend
start "Frontend Server - Port 3000" cmd /k npm start

cd ..

echo.
echo Application started successfully!
echo.
echo Access URLs:
echo   Main App: http://localhost:3000
echo   API: http://localhost:5000
echo   API Docs: http://localhost:5000/docs
echo.
echo Press Ctrl+C in each window to stop the servers
echo.
pause