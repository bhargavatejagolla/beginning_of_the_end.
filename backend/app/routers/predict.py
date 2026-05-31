from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from services.predictor import predictor

router = APIRouter(prefix="/predict", tags=["prediction"])


class Transaction(BaseModel):
    # Flexible: accept any key-value pairs, then convert to DataFrame
    data: dict


@router.post("/")
async def predict(transaction: Transaction):
    try:
        df = pd.DataFrame([transaction.data])
        result = predictor.predict(df)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
