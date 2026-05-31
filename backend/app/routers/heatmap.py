from fastapi import APIRouter
from services.data_manager import data_manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/heatmap", tags=["heatmap"])

@router.get("")
async def get_heatmap_coordinates():
    try:
        if not data_manager.is_loaded:
            return []
            
        return data_manager.get_heatmap_data()
    except Exception as e:
        logger.error(f"Failed to fetch heatmap data: {e}")
        return []
