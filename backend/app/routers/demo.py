from fastapi import APIRouter
from services.simulator import simulator

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/scenario/{scenario_name}")
async def set_scenario(scenario_name: str):
    simulator.set_scenario(scenario_name)
    return {"scenario": scenario_name, "status": "activated"}
