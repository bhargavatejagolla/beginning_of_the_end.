#!/bin/bash
echo "==================================================="
echo "🛡️  Starting CyberShield Suite (Local + Neo4j Docker)"
echo "==================================================="
echo

# Step 1: Start pre-built Neo4j container
echo "[1/4] Starting pre-built Neo4j Docker container..."
docker stop cybershield-neo4j >/dev/null 2>&1
docker rm cybershield-neo4j >/dev/null 2>&1
docker run -d --name cybershield-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5.20.0-community

echo
echo "⏳ Waiting for Neo4j to initialize..."
echo

until nc -z localhost 7687 2>/dev/null; do
    echo "... database starting up, checking again ..."
    sleep 3
done

echo
echo "🗄️  Neo4j is online! Seeding graph nodes and transactions..."
cd backend
export PYTHONPATH=app
export NEO4J_URI=bolt://localhost:7687
source venv/bin/activate
python scripts/graph_loader.py
cd ..

# Step 2: Start Backend Locally
echo
echo "[3/4] Launching FastAPI Backend Server..."
cd backend
export PYTHONPATH=app
export NEO4J_URI=bolt://localhost:7687
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000 &
cd ..

# Step 3: Start Frontend Locally
echo
echo "[4/4] Launching Next.js Frontend App..."
cd frontend
npm run dev &
cd ..

echo
echo "==================================================="
echo "🎉 CyberShield is fully connected and active!"
echo
echo "🌐 Frontend Dashboard: http://localhost:3000"
echo "🖥️  Backend API:        http://localhost:8000"
echo "📊 Neo4j Console:      http://localhost:7474"
echo "==================================================="
echo
wait
