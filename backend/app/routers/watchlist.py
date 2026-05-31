from fastapi import APIRouter
from services.data_manager import data_manager

router = APIRouter(prefix="/watchlist", tags=["watchlist"])

@router.get("/")
async def get_watchlist():
    try:
        if not data_manager.is_loaded:
            return []
            
        return data_manager.get_watchlist_data()
    except Exception as e:
        print(f"Error fetching watchlist data: {e}")
        return []
