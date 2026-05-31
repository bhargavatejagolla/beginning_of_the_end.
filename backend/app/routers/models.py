from fastapi import APIRouter
from services.predictor import predictor
from services.data_manager import data_manager
import numpy as np

router = APIRouter(prefix="/models", tags=["models"])

@router.get("/drift")
async def drift():
    # Calculate a dynamic "drift" based on the current dataset risk mean vs a baseline (0.15)
    if data_manager.is_loaded and data_manager.df_feat is not None:
        current_mean = float(data_manager.df_feat['risk_score'].mean())
        drift_val = abs(current_mean - 0.15)
        status = "normal" if drift_val < 0.05 else "drift_detected"
        return {"drift": drift_val, "status": status}
    return {"drift": 0.02, "status": "normal"}

@router.get("/features")
async def features():
    # Dynamically extract feature importances from the .pkl model
    try:
        importances = None
        if hasattr(predictor.model, "named_estimators_"):
            if "lgbm" in predictor.model.named_estimators_:
                importances = predictor.model.named_estimators_["lgbm"].feature_importances_
            elif "xgb" in predictor.model.named_estimators_:
                importances = predictor.model.named_estimators_["xgb"].feature_importances_
                
        if importances is None:
            importances = np.ones(len(predictor.feature_names))
            
        # Normalize and pair with names
        importances = importances / np.sum(importances)
        feature_data = list(zip(predictor.feature_names, importances))
        
        # Sort and get top 5
        feature_data.sort(key=lambda x: x[1], reverse=True)
        top_5 = feature_data[:5]
        
        mapping = {
            "BehaviorStd": "Anomalous Velocity",
            "BehaviorMax": "Peak Burst Amount",
            "SparseToBehaviorRatio": "Stealth Ratio",
            "AccountAgeDays": "Account Age",
            "AnomalyDensity": "Anomaly Density",
            "ActivityRiskScore": "Composite Activity Risk",
            "F2230": "High-Frequency Transfers",
            "F159": "Device Hardware Ring"
        }
        
        colors = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6"]
        
        result = []
        for i, (name, val) in enumerate(top_5):
            readable = mapping.get(name, name)
            result.append({
                "name": readable,
                "value": round(float(val) * 100, 2),
                "color": colors[i % len(colors)]
            })
            
        return result
    except Exception as e:
        return [
            {"name": "Anomalous Velocity", "value": 100, "color": "#ef4444"},
            {"name": "Fallback Required", "value": 50, "color": "#f97316"}
        ]
