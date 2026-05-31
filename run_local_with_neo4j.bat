@echo off
echo ===================================================
echo 🛡️  Starting CyberShield Suite (Local + Neo4j Docker)
echo ===================================================
echo.

:: Step 1: Start pre-built Neo4j container (no local building required!)
echo [1/4] Starting pre-built Neo4j Docker container...
docker stop cybershield-neo4j >nul 2>&1
docker rm cybershield-neo4j >nul 2>&1
docker run -d --name cybershield-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5.20.0-community

echo.
echo ⏳ Waiting for Neo4j to initialize (takes about 10 seconds)...
echo.

:wait_loop
timeout /t 3 >nul
powershell -Command "$s = New-Object System.Net.Sockets.TcpClient; $s.Connect('localhost', 7687); $s.Close()" >nul 2>&1
if %errorlevel% neq 0 (
    echo ... database starting up, checking again ...
    goto wait_loop
)

echo.
echo ⏳ Port open! Waiting 15 extra seconds for Neo4j internal services to finalize...
timeout /t 15 >nul

echo.
echo 🗄️  Neo4j is online! Seeding graph nodes and transactions...
cd backend
set PYTHONPATH=app
set NEO4J_URI=bolt://127.0.0.1:7687
call venv\Scripts\activate
python scripts/graph_loader.py
cd ..

:: Step 2: Start Backend Locally in a new command window
echo.
echo [3/4] Launching FastAPI Backend Server...
start "CyberShield Backend API" cmd /k "cd backend && call venv\Scripts\activate && set PYTHONPATH=app&& set NEO4J_URI=bolt://127.0.0.1:7687&& python -m uvicorn app.main:app --reload --port 8000"

:: Step 3: Start Frontend Locally in a new command window
echo.
echo [4/4] Launching Next.js Frontend App...
start "CyberShield Frontend Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo 🎉 CyberShield is fully connected and active!
echo.
echo 🌐 Frontend Dashboard: http://localhost:3000
echo 🖥️  Backend API:        http://localhost:8000
echo 📊 Neo4j Console:      http://localhost:7474
echo ===================================================
echo.
pause
