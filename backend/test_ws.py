import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('ws://127.0.0.1:8000/ws/live') as ws:
            print("Connected!")
            while True:
                msg = await ws.recv()
                print("RECEIVED:", msg)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
