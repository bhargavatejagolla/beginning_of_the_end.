from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# Direct package imports aligned with PYTHONPATH=/app/app
# Direct package imports aligned with PYTHONPATH=/app/app
from routers import predict, cases, feeds, demo, graph, models, investigate, watchlist, websocket, copilot, heatmap
from services.simulator import simulator
from services.case_manager import case_manager

app = FastAPI(title="CyberShield AI API", version="0.1.0")

# Unified CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://cybershield.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Unified routers inclusion
app.include_router(predict.router)
app.include_router(cases.router)
app.include_router(feeds.router)
app.include_router(demo.router)
app.include_router(graph.router)
app.include_router(models.router)
app.include_router(investigate.router)
app.include_router(watchlist.router)
app.include_router(websocket.router)
app.include_router(copilot.router)
app.include_router(heatmap.router)



from services.data_manager import data_manager

@app.on_event("startup")
async def startup_event():
    # Initialize the local SQLite database
    await case_manager.init_db()
    
    # Load large datasets into memory caches in background thread
    import asyncio
    asyncio.create_task(data_manager.load_data())
    
    # Start the Transaction Simulator singleton stream
    await simulator.start()
    print("[SUCCESS] CyberShield SQLite database, DataManager cache, and Transaction Simulator initialized.")


@app.on_event("shutdown")
async def shutdown_event():
    # Stop the Transaction Simulator singleton stream
    await simulator.stop()
    print("[STOPPED] Transaction Simulator stopped successfully.")


@app.get("/health")
async def health():
    return {"status": "ok", "message": "CyberShield API is running."}

@app.get("/debug")
async def debug():
    try:
        dm_len = len(data_manager.df_feat) if data_manager.df_feat is not None else 0
        dm_loaded = data_manager.is_loaded
        websockets = len(simulator.connected_websockets)
        sim_task = simulator._task is not None
        sim_counter = getattr(simulator, "_stream_counter", 0)
        target_indices = len(getattr(simulator, "fraud_indices", []))
        return {
            "dm_loaded": dm_loaded,
            "dm_len": dm_len,
            "websockets": websockets,
            "sim_task": sim_task,
            "sim_counter": sim_counter,
            "target_indices": target_indices
        }
    except Exception as e:
        return {"error": str(e)}
