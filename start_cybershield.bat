@echo off
echo ===================================================
echo     CyberShield AI - Starting Servers
echo ===================================================

echo [1] Starting Backend API Server (Port 8000)...
cd backend
start cmd /k "set PYTHONPATH=app && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2] Starting Frontend UI (Port 3000)...
cd ../frontend
start cmd /k "npm run dev"

echo.
echo Servers are starting up in separate windows!
echo - Backend is at http://localhost:8000
echo - Frontend is at http://localhost:3000
echo.
pause
