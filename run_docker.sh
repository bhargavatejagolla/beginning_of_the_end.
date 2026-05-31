#!/bin/bash
echo "==================================================="
echo "🛡️  Starting CyberShield Suite via Docker Compose..."
echo "==================================================="
echo

# Step 1: Start all services in the background
docker-compose up --build -d

echo
echo "⏳ Waiting for Neo4j Database to start up..."
echo

# Wait loop
until docker-compose exec -T api python -c "import socket; s = socket.socket(); s.connect(('neo4j', 7687))" 2>/dev/null; do
    echo "... database starting up, checking again ..."
    sleep 3
done

echo
echo "🗄️  Neo4j is online! Seeding graph nodes & transactions..."
docker-compose exec -T api python scripts/graph_loader.py

echo
echo "==================================================="
echo "🎉 CyberShield is fully connected and active!"
echo
echo "🌐 Frontend Dashboard: http://localhost:3000"
echo "🖥️  Backend API:        http://localhost:8000"
echo "📊 Neo4j Console:      http://localhost:7474"
echo "==================================================="
echo
