from fastapi import APIRouter
from pydantic import BaseModel
from services.feed_ingestor import feed_ingestor, stored_alerts

router = APIRouter(prefix="/feeds", tags=["feeds"])

@router.get("/")
async def get_feeds():
    return stored_alerts[-20:]  # last 20


class RegulatoryAlert(BaseModel):
    phone: str
    fraud_type: str
    details: dict = {}


@router.post("/ingest")
async def ingest_feed(alert: RegulatoryAlert):
    await feed_ingestor.ingest(alert.dict())
    return {"message": "Feed ingested"}
