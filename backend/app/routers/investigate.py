from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from services.orchestrator import orchestrator

router = APIRouter(prefix="/investigate", tags=["investigate"])

class InvestigateRequest(BaseModel):
    account_id: int
    features: Optional[Dict] = None

@router.post("/")
async def investigate_account(req: InvestigateRequest):
    try:
        case_data = await orchestrator.investigate(req.account_id, req.features)
        return case_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
