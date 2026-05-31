import sys
import os

# Resolve paths so imports from the app directory work regardless of where we run the script
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
app_dir = os.path.join(backend_dir, "app")
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pandas as pd
from neo4j import GraphDatabase
from core.config import settings
import json

df_feat = pd.read_parquet("data/features_final.parquet")
df_orig = pd.read_csv("DataSet.csv")
df_feat['account_id'] = df_orig.index  # ensure alignment

driver = GraphDatabase.driver(settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD))

with driver.session() as session:
    for idx, row in df_feat.iterrows():
        acc_id = int(row['account_id'])
        feature_dict = row.drop('account_id').to_dict()
        # Convert to JSON string
        session.run(
            "MATCH (a:Account {account_id: $id}) SET a.features = $features",
            id=acc_id, features=json.dumps(feature_dict)
        )
driver.close()
