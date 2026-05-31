from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.simulator import simulator

router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await websocket.accept()
    await simulator.register(websocket)
    try:
        while True:
            # Keep connection alive by waiting for any incoming message (optional)
            # We don't expect messages from client, just keep open
            await websocket.receive_text()
    except WebSocketDisconnect:
        await simulator.unregister(websocket)
