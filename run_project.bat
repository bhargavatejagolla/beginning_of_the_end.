@echo off
echo ===================================================
echo 🛡️  Starting CyberShield Investigation AI Suite...
echo ===================================================

:: Start Backend in a new command window
echo.
echo [1/2] Launching FastAPI Backend Server...
start "CyberShield Backend API" cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && set PYTHONPATH=app&& python -m uvicorn app.main:app --reload --port 8000"

:: Start Frontend in a new command window
echo.
echo [2/2] Launching Next.js Frontend App...
start "CyberShield Frontend Dashboard" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ===================================================
echo 🚀 CyberShield startup sequences triggered!
echo.
echo 🌐 Backend API running at: http://localhost:8000
echo 🖥️  Frontend Dashboard running at: http://localhost:3000
echo ===================================================
pause
