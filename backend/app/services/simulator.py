import asyncio
import pandas as pd
import json
from fastapi import WebSocket
from typing import List
from services.data_manager import data_manager

class TransactionSimulator:
    def __init__(self):
        self.connected_websockets: List[WebSocket] = []
        self._stop_event = asyncio.Event()
        self._task = None

    async def start(self):
        """Start streaming loop"""
        self._task = asyncio.create_task(self._stream_loop())

    async def stop(self):
        """Stop streaming"""
        self._stop_event.set()
        if self._task:
            await self._task

    async def register(self, websocket: WebSocket):
        """Register a new WebSocket client"""
        self.connected_websockets.append(websocket)

    async def unregister(self, websocket: WebSocket):
        """Remove a WebSocket client"""
        self.connected_websockets.remove(websocket)

    def set_scenario(self, scenario_name: str):
        """Sets the streaming loop to jump to a specific index for demo scenarios"""
        indices = {
            "pig_butchering": 9001,
            "layering": 9005,
            "rapid_cashout": 9010
        }
        target_idx = indices.get(scenario_name, 9001)
        self._current_idx = target_idx
        self._demo_mode_active = True
        self._demo_timer = 15
        print(f"🎯 Demo scenario activated: {scenario_name} (jumping to index {target_idx})")

    async def _stream_loop(self):
        """Stream each row of the dataset every 1.5 seconds"""
        self._current_idx = 0
        self._demo_mode_active = False
        self._demo_timer = 0
        self._stream_counter = 0
        
        self.fraud_indices = []
        self.normal_indices = []

        print("[SIMULATOR] Stream loop task started.")
        while not self._stop_event.is_set():
            if not self.connected_websockets:
                print("[SIMULATOR] Waiting for websocket clients...", flush=True)
                await asyncio.sleep(0.5)
                continue
                
            if not data_manager.is_loaded:
                print("[SIMULATOR] Waiting for data manager to load...", flush=True)
                await asyncio.sleep(0.5)
                continue

            df_feat = data_manager.get_full_feat()
            df_orig = data_manager.get_full_orig()
            
            if df_feat is None or len(df_feat) == 0 or df_orig is None:
                await asyncio.sleep(0.5)
                continue

            if not self.fraud_indices and not self.normal_indices:
                self.fraud_indices = df_feat[df_feat['is_mule'] == 1].index.tolist()
                if not self.fraud_indices:
                    self.fraud_indices = df_feat[df_feat['risk_score'] >= 0.7].index.tolist()
                self.normal_indices = df_feat[~df_feat.index.isin(self.fraud_indices)].index.tolist()

            # Intelligent Interleaving: 3 Normal, 1 Fraud
            if self._stream_counter % 4 == 3 and self.fraud_indices:
                target_idx = self.fraud_indices[(self._stream_counter // 4) % len(self.fraud_indices)]
            elif self.normal_indices:
                normal_idx = self._stream_counter - (self._stream_counter // 4)
                target_idx = self.normal_indices[normal_idx % len(self.normal_indices)]
            else:
                target_idx = df_feat.index[self._stream_counter % len(df_feat)]

            try:
                # Extract the actual row position
                pos = self._stream_counter % len(df_feat)
                try:
                    if isinstance(target_idx, (int, str)) and target_idx in df_feat.index:
                        loc = df_feat.index.get_loc(target_idx)
                        if isinstance(loc, slice):
                            pos = loc.start
                        elif isinstance(loc, np.ndarray):
                            pos = loc.nonzero()[0][0]
                        else:
                            pos = int(loc)
                except Exception:
                    pass

                row = df_feat.iloc[pos]
                row_orig = df_orig.iloc[pos]
                
                try:
                    account_id = int(row.name)
                except:
                    account_id = int(row.get('account_id', pos))
                
                # 🚀 LIVE ML INFERENCE using the ensemble .pkl models!
                from services.predictor import predictor
                row_df = df_feat.iloc[[pos]].copy()
                pred = predictor.predict(row_df)
                
                # Predictor returns 0-100 scale. Normalize to 0-1 for the frontend.
                risk_score = float(pred.get('risk_score', 0)) / 100.0
                risk_level = pred.get('risk_level', 'LOW')
                
                import math
                import random
                random.seed(account_id + self._current_idx)
                
                # Robust NaN handling for JSON serialization to prevent WebSocket crashes
                behavior_std = row_orig.get("BehaviorStd", 1.5)
                if pd.isna(behavior_std) or (isinstance(behavior_std, float) and math.isnan(behavior_std)):
                    behavior_std = 1.5
                else:
                    behavior_std = float(behavior_std)
                
                # BehaviorStd in the CSV is already a large variance (e.g. 50,000). 
                # We just add some small noise to it to make it look like a real transaction amount.
                amount = round(abs(behavior_std) + random.randint(100, 5000), 2)
                
                # Cap the maximum simulated amount at ₹5,000,000 (50 Lakhs) so it doesn't look like a glitch
                if amount > 5000000:
                    amount = round(500000 + random.randint(10000, 50000), 2)

                enriched_data = {
                    "account_id": account_id,
                    "tx_id": f"TXN-{pd.Timestamp.now().strftime('%y%m%d%H%M%S')}-{account_id}",
                    "source_node": f"ACT-{account_id}",
                    "target_node": f"ACT-{int(account_id + 423) if risk_score >= 0.7 else 1209}",
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "flagged": risk_score >= 0.7,
                    "amount": amount,
                    "timestamp": pd.Timestamp.now().isoformat(),
                    "shap_values": pred.get("shap_values", []),
                    "feature_names": pred.get("feature_names", []),
                    "lgbm_score": pred.get("lgbm_score", 0),
                    "xgb_score": pred.get("xgb_score", 0)
                }
            except Exception as e:
                print(f"Simulator live inference error: {e}")
                account_id = self._stream_counter
                enriched_data = {
                    "account_id": account_id,
                    "tx_id": f"TXN-ERR-{account_id}",
                    "source_node": f"ACT-{account_id}",
                    "target_node": "UNKNOWN",
                    "risk_score": 0.12,
                    "risk_level": "LOW",
                    "flagged": False,
                    "amount": 250.0,
                    "timestamp": pd.Timestamp.now().isoformat()
                }

            # Send to all connected clients
            for ws in self.connected_websockets:
                try:
                    await ws.send_text(json.dumps({
                        "type": "transaction",
                        "data": enriched_data,
                        "timestamp": enriched_data["timestamp"]
                    }))
                    
                    if enriched_data["flagged"]:
                        await ws.send_text(json.dumps({
                            "type": "alert",
                            "data": enriched_data,
                            "timestamp": enriched_data["timestamp"]
                        }))
                except:
                    pass 

            self._stream_counter += 1
            
            if self._demo_mode_active and self._demo_timer > 0:
                self._demo_timer -= 1
                if self._demo_timer == 0:
                    self._demo_mode_active = False
                await asyncio.sleep(0.8)
            else:
                await asyncio.sleep(1.5)

# Singleton instance
simulator = TransactionSimulator()
