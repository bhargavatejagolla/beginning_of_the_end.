import asyncio
from services.data_manager import data_manager

async def test_data_manager():
    print("Testing data_manager.load_data()...")
    await data_manager.load_data()
    print("Is loaded:", data_manager.is_loaded)

if __name__ == "__main__":
    asyncio.run(test_data_manager())
