import pandas as pd
import numpy as np
import os
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from services.predictor import predictor

logger = logging.getLogger(__name__)

class DataManager:
    def __init__(self):
        self.df_feat = None
        self.df_orig = None
        self.target = None
        self.heatmap_cache = []
        self.watchlist_cache = []
        self.is_loaded = False
        self._lock = asyncio.Lock()
        
    async def load_data(self):
        async with self._lock:
            if self.is_loaded:
                return
            
            logger.info("Initializing DataManager: Loading datasets into memory...")
            loop = asyncio.get_event_loop()
            
            with ThreadPoolExecutor() as pool:
                await loop.run_in_executor(pool, self._load_and_compute)
                
            logger.info("DataManager initialization complete. Caches ready.")
            self.is_loaded = True

    def _resolve_path(self, filename, search_paths):
        for path in search_paths:
            if os.path.exists(path):
                return path
        return filename

    def _load_and_compute(self):
        try:
            csv_paths = ["DataSet.csv", "data/DataSet.csv", "../DataSet.csv", "backend/DataSet.csv", "cybershield/backend/DataSet.csv"]
            parquet_paths = ["data/features_final.parquet", "backend/data/features_final.parquet", "../data/features_final.parquet", "cybershield/backend/data/features_final.parquet"]
            target_paths = ["data/target.parquet", "backend/data/target.parquet", "../data/target.parquet", "cybershield/backend/data/target.parquet"]
            
            csv_path = self._resolve_path(csv_paths[0], csv_paths)
            parquet_path = self._resolve_path(parquet_paths[0], parquet_paths)
            target_path = self._resolve_path(target_paths[0], target_paths)

            self.df_feat = pd.read_parquet(parquet_path)
            self.df_orig = pd.read_csv(csv_path)
            
            # Target
            if os.path.exists(target_path):
                self.target = pd.read_parquet(target_path)
            else:
                self.target = pd.DataFrame({'is_mule': np.zeros(len(self.df_feat))})
                
            self.df_feat['account_id'] = self.df_orig.index
            
            logger.info("Predicting risk scores for entire dataset...")
            risk_scores = predictor.model.predict_proba(self.df_feat[predictor.feature_names])[:, 1]
            self.df_feat['risk_score'] = risk_scores
            self.df_feat['is_mule'] = self.target.values.ravel()
            
            # Align risk_score and account_id to df_orig for copilot
            self.df_orig['account_id'] = self.df_orig.index
            self.df_orig['risk_score'] = risk_scores

            self._compute_heatmap_cache()
            self._compute_watchlist_cache()
            
        except Exception as e:
            logger.error(f"Failed to load data in DataManager: {e}")

    def _compute_heatmap_cache(self):
        watch = self.df_feat.sort_values('risk_score', ascending=False).head(100).copy()
        
        metro_coords = [
            {"lat": 19.0760, "lng": 72.8777, "city": "Mumbai"},
            {"lat": 28.6139, "lng": 77.2090, "city": "Delhi"},
            {"lat": 12.9716, "lng": 77.5946, "city": "Bengaluru"},
            {"lat": 17.3850, "lng": 78.4867, "city": "Hyderabad"},
            {"lat": 13.0827, "lng": 80.2707, "city": "Chennai"},
            {"lat": 22.5726, "lng": 88.3639, "city": "Kolkata"},
            {"lat": 23.0225, "lng": 72.5714, "city": "Ahmedabad"},
            {"lat": 26.8467, "lng": 80.9462, "city": "Lucknow"},
            {"lat": 20.2961, "lng": 85.8245, "city": "Bhubaneswar"},
            {"lat": 30.7333, "lng": 76.7794, "city": "Chandigarh"}
        ]
        rural_coords = [
            {"lat": 20.5937, "lng": 78.9629, "region": "Central Rural"},
            {"lat": 24.6637, "lng": 73.8436, "region": "West Rural"},
            {"lat": 15.3173, "lng": 75.7139, "region": "South Rural"},
            {"lat": 27.5330, "lng": 82.2455, "region": "North Rural"},
            {"lat": 26.2006, "lng": 92.9376, "region": "East Rural"}
        ]
        
        result = []
        for idx, row in watch.iterrows():
            acc_id = int(row['account_id'])
            risk_score = round(float(row['risk_score'] * 100), 2)
            np.random.seed(acc_id)
            area_code = str(self.df_orig.iloc[acc_id].get('F3890', 'R')).strip()
            
            if area_code == 'M':
                base = metro_coords[acc_id % len(metro_coords)]
                lat = base["lat"] + np.random.uniform(-0.15, 0.15)
                lng = base["lng"] + np.random.uniform(-0.15, 0.15)
                location = base["city"]
            else:
                base = rural_coords[acc_id % len(rural_coords)]
                lat = base["lat"] + np.random.uniform(-0.4, 0.4)
                lng = base["lng"] + np.random.uniform(-0.4, 0.4)
                location = base["region"]
                
            result.append({
                "account_id": acc_id,
                "latitude": round(lat, 5),
                "longitude": round(lng, 5),
                "risk_score": risk_score,
                "location": location,
                "type": "Metro Node" if area_code == 'M' else "Rural Endpoint"
            })
        self.heatmap_cache = result

    def _compute_watchlist_cache(self):
        watch = self.df_feat[(self.df_feat['risk_score'] > 0.7) & (self.df_feat['is_mule'] == 0)].copy()
        watch['pre_mule_score'] = watch['risk_score']
        watch['account_age_days'] = watch['AccountAgeDays'].astype(int) if 'AccountAgeDays' in watch.columns else 30
        watch['night_activity'] = (watch['account_id'] % 3 == 0)
        result = watch[['account_id', 'pre_mule_score', 'account_age_days', 'night_activity']].sort_values('pre_mule_score', ascending=False).head(20)
        self.watchlist_cache = result.to_dict(orient='records')

    def get_heatmap_data(self):
        return self.heatmap_cache

    def get_watchlist_data(self):
        return self.watchlist_cache

    def get_full_orig(self):
        return self.df_orig

    def get_full_feat(self):
        return self.df_feat

data_manager = DataManager()
