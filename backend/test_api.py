import sys
import asyncio
from fastapi.testclient import TestClient
sys.path.insert(0, "app")
from app.main import app

client = TestClient(app)

def run_test():
    print("Testing /health...")
    response = client.get("/health")
    print(response.status_code, response.json())
    
    print("Testing /debug...")
    response = client.get("/debug")
    print(response.status_code, response.json())

if __name__ == "__main__":
    run_test()
