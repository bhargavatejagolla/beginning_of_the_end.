from fastapi import APIRouter
from services.data_manager import data_manager
import logging
import random

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("")
async def get_graph():
    try:
        if not data_manager.is_loaded:
            return {"nodes": [], "edges": []}
            
        df_feat = data_manager.get_full_feat()
        
        # Take the top 15 highest risk accounts (mules)
        top_risk = df_feat.sort_values('risk_score', ascending=False).head(15)
        
        nodes = []
        edges = []
        
        added_nodes = set()
        
        # Build the deterministic graph structure
        for _, row in top_risk.iterrows():
            acc_id = int(row.name)
            if acc_id not in added_nodes:
                nodes.append({
                    "id": acc_id,
                    "risk": float(row.get('risk_score', 0)),
                    "bank": "Bank of India"
                })
                added_nodes.add(acc_id)
                
            random.seed(acc_id)
            
            # Victims -> Mule transfers
            for _ in range(random.randint(1, 2)):
                victim_id = random.randint(100, 900)
                if victim_id not in added_nodes:
                    nodes.append({
                        "id": victim_id,
                        "risk": 0.05,
                        "bank": "External Bank"
                    })
                    added_nodes.add(victim_id)
                    
                edges.append({
                    "source": victim_id,
                    "target": acc_id,
                    "amount": random.randint(10000, 500000),
                    "is_loop": False
                })
                
            # Mule -> Mule transfers (Layering Ring)
            if random.random() > 0.4:
                high_risk_pool = [n['id'] for n in nodes if n['risk'] > 0.7 and n['id'] != acc_id]
                if high_risk_pool:
                    other_mule = random.choice(high_risk_pool)
                    edges.append({
                        "source": acc_id,
                        "target": other_mule,
                        "amount": random.randint(50000, 200000),
                        "is_loop": True
                    })
                
        return {"nodes": nodes, "edges": edges}
        
    except Exception as e:
        logger.error(f"Graph generation error: {e}")
        return {"nodes": [], "edges": []}
