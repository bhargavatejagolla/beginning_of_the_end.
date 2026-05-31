# backend/scripts/graph_loader.py
import warnings
warnings.filterwarnings("ignore")
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
import numpy as np
from neo4j import GraphDatabase
from core.config import settings
import joblib
import random
from datetime import datetime, timedelta
from faker import Faker

# ---------- CONFIG ----------
NEO4J_URI = settings.NEO4J_URI
NEO4J_USER = settings.NEO4J_USER
NEO4J_PASSWORD = settings.NEO4J_PASSWORD
CSV_PATH = "DataSet.csv"                          # adjust if needed
MODEL_PATH = "app/models/cybershield_ensemble_model.pkl"       # your ensemble model
FEATURES_PATH = "app/models/cybershield_features.pkl"    # feature order

# ---------- LOAD MODEL & DATA ----------
print("Loading model and data...")
model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURES_PATH)
df = pd.read_csv(CSV_PATH)
df['account_id'] = df.index                      # use row index as unique ID
print(f"CSV loaded: {df.shape}")

# Preprocessing: we need the same feature set as training.
# For simplicity, we'll create a minimal feature set from the categorical columns
# and the engineered 6-block aggregates that you saved.
# We'll assume you have a function `transform_row(row)` that mirrors your notebook.
# Here we'll quickly replicate a simplified version that outputs a DataFrame
# with exactly the feature_names columns. For now, we'll use the already engineered
# features that you saved earlier (features_train.parquet) – we'll load that instead
# to get the model-ready features.
# Actually, we stored features_final.parquet earlier? In your preprocessing pipeline,
# you created features_final.parquet and target.parquet. We'll load them to get risk scores.
try:
    X_final = pd.read_parquet("data/features_final.parquet")
    y = pd.read_parquet("data/target.parquet")
    # align with df order (should be same)
    X_final['account_id'] = df['account_id']
except FileNotFoundError:
    # Fallback: use raw df but then we need full feature engineering pipeline.
    # Since you already have those parquet files, we'll use them.
    raise SystemExit(
        "Please ensure data/features_final.parquet exists from Phase 1.")

# Predict risk scores for all accounts
risk_scores = model.predict_proba(X_final[feature_names])[:, 1]
df['risk_score'] = risk_scores
df['is_mule'] = y.values.ravel()

# ---------- NEO4J DRIVER ----------
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def clear_database():
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n").consume()
    print("Existing graph cleared.")

# ---------- CREATE ACCOUNT NODES ----------

def create_accounts_batch(tx, batch):
    query = """
    UNWIND $batch AS row
    CREATE (a:Account {
        account_id: row.account_id,
        account_type: row.account_type,
        occupation: row.occupation,
        gender: row.gender,
        region: row.region,
        opening_date: row.opening_date,
        is_mule: row.is_mule,
        risk_score: row.risk_score,
        bank: 'Bank of India'
    })
    """
    tx.run(query, batch=batch)

# Clear existing graph and set up indexing constraint
clear_database()

print("Creating Neo4j indexing constraints...")
with driver.session() as session:
    try:
        session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (a:Account) REQUIRE a.account_id IS UNIQUE")
    except Exception as e:
        print(f"Could not create constraint: {e}. Proceeding without constraint.")

print("Creating Account nodes...")
accounts_batch = []
for _, row in df.iterrows():
    accounts_batch.append({
        'account_id': int(row['account_id']),
        'account_type': str(row.get('F3886', 'Unknown')),
        'occupation': str(row.get('F3891', 'Unknown')),
        'gender': str(row.get('F3892', 'Unknown')),
        'region': str(row.get('F3890', 'Unknown')),
        'opening_date': str(row.get('F3888', 'Unknown')),
        'is_mule': bool(row['is_mule']),
        'risk_score': float(row['risk_score'])
    })

# Batch insert in chunks of 2000
chunk_size = 2000
with driver.session() as session:
    for i in range(0, len(accounts_batch), chunk_size):
        chunk = accounts_batch[i:i + chunk_size]
        session.execute_write(create_accounts_batch, chunk)
print("Accounts created.")

# ---------- GENERATE TRANSACTIONS ----------
fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

# We'll generate a consistent set of transactions per account.
# For normal accounts: a few small transactions.
# For mule accounts: a victim credit followed by multiple outgoing transfers.


def generate_transactions(account_id, is_mule, row):
    txs = []
    now = datetime(2026, 5, 24, 11, 0, 0)  # demo baseline
    if is_mule:
        # Pick a victim account (some other random account with high balance proxy)
        # For realism, we choose a victim that is not a mule and has high amount features.
        # We'll use a simple heuristic: accounts with high F3912 (our discovered fraud telemetry) are mules,
        # so we avoid them. We'll just pick a random normal account with high 'max amount' from the blocks.
        # Since we have features_final, we can compute a synthetic 'wealth' score.
        # For simplicity, we select a victim from accounts not flagged as mule and with high risk_score? No, risk_score is low.
        # We'll use a random normal account with index > 100 (to avoid first rows).
        victim_candidates = df[(df['is_mule'] == 0) & (df['account_id'] > 100)]
        if len(victim_candidates) > 0:
            victim = victim_candidates.sample(1).iloc[0]
            victim_id = int(victim['account_id'])
            # Large credit from victim
            amount = float(np.random.uniform(50000, 200000))
            tx = {
                'from_account': victim_id,
                'to_account': account_id,
                'amount': amount,
                'timestamp': now + timedelta(seconds=random.randint(1, 10)),
                'device_id': f"dev_{random.randint(1, 20)}",
                'phone': fake.phone_number()[:10]
            }
            txs.append(tx)
            now = tx['timestamp'] + timedelta(seconds=5)
            # Split into 3-5 outgoing transfers to other accounts (some real, some synthetic later)
            for _ in range(random.randint(3, 5)):
                # To a random account (could be real or synthetic; we'll assign later)
                # We'll temporarily set to_account = None and fill with synthetic bank accounts later
                tx = {
                    'from_account': account_id,
                    'to_account': None,  # placeholder
                    'amount': amount / np.random.randint(3, 6),
                    'timestamp': now + timedelta(seconds=random.randint(1, 5)),
                    'device_id': f"dev_{random.randint(1, 20)}",
                    'phone': fake.phone_number()[:10]
                }
                txs.append(tx)
        else:
            # fallback: just a couple normal transactions
            amount = float(np.random.uniform(100, 5000))
            tx = {
                'from_account': random.choice(df['account_id'].sample(1).values[0]),
                'to_account': account_id,
                'amount': amount,
                'timestamp': now,
                'device_id': f"dev_{random.randint(1, 50)}",
                'phone': fake.phone_number()[:10]
            }
            txs.append(tx)
    else:
        # Normal account: 1-3 transactions
        for _ in range(random.randint(1, 3)):
            other = random.choice(df['account_id'].values)
            amount = float(np.random.uniform(100, 10000))
            from_acc = account_id if random.random() > 0.5 else other
            tx = {
                'from_account': from_acc,
                'to_account': other if from_acc != other else account_id,
                'amount': amount,
                'timestamp': now + timedelta(seconds=random.randint(1, 100)),
                'device_id': f"dev_{random.randint(1, 50)}",
                'phone': fake.phone_number()[:10]
            }
            txs.append(tx)
    return txs


# We'll first collect all transactions
all_transactions = []
mule_ids = df[df['is_mule'] == 1]['account_id'].values
for idx, row in df.iterrows():
    is_mule = row['is_mule']
    acc_id = int(row['account_id'])
    txs = generate_transactions(acc_id, is_mule, row)
    for t in txs:
        t['from_account'] = int(
            t['from_account']) if t['from_account'] is not None else None
        t['to_account'] = int(
            t['to_account']) if t['to_account'] is not None else None
    all_transactions.extend(txs)

# ---------- CREATE SYNTHETIC CROSS-BANK ACCOUNTS ----------
print("Creating synthetic cross-bank accounts...")
fake = Faker()
Faker.seed(123)
# Bank B and Bank C will have 50 accounts each
synthetic_accounts = []
for bank_name in ['Bank B', 'Bank C']:
    for i in range(50):
        acc_id = 100000 + len(synthetic_accounts) + 1
        synthetic_accounts.append({
            'account_id': acc_id,
            'account_type': random.choice(['Savings', 'Current']),
            'occupation': fake.job(),
            'gender': random.choice(['M', 'F']),
            'region': fake.city(),
            'opening_date': (datetime(2020, 1, 1) + timedelta(days=random.randint(0, 2000))).strftime("%d-%m-%Y"),
            'is_mule': 0,
            'risk_score': np.random.uniform(0.1, 0.3),
            'bank': bank_name
        })

# Create synthetic account nodes
def create_synthetic_accounts_batch(tx, batch):
    query = """
    UNWIND $batch AS row
    CREATE (a:Account {
        account_id: row.account_id,
        account_type: row.account_type,
        occupation: row.occupation,
        gender: row.gender,
        region: row.region,
        opening_date: row.opening_date,
        is_mule: row.is_mule,
        risk_score: row.risk_score,
        bank: row.bank
    })
    """
    tx.run(query, batch=batch)

print("Creating synthetic account nodes...")
with driver.session() as session:
    session.execute_write(create_synthetic_accounts_batch, synthetic_accounts)

# ---------- FILL PLACEHOLDER CROSS-BANK TRANSFERS ----------
# Now replace the None 'to_account' in mule outgoing transfers with synthetic accounts
synthetic_ids = [a['account_id'] for a in synthetic_accounts]
bank_b_ids = [a['account_id']
              for a in synthetic_accounts if a['bank'] == 'Bank B']
bank_c_ids = [a['account_id']
              for a in synthetic_accounts if a['bank'] == 'Bank C']

for tx in all_transactions:
    if tx['to_account'] is None and tx['from_account'] in mule_ids:
        # Assign to a random synthetic account (Bank B first, then maybe Bank C)
        if random.random() < 0.6:
            tx['to_account'] = random.choice(bank_b_ids)
        else:
            tx['to_account'] = random.choice(bank_c_ids)

# Also add some transactions between synthetic accounts to create layering
for _ in range(30):
    from_acc = random.choice(synthetic_ids)
    to_acc = random.choice(synthetic_ids)
    if from_acc == to_acc:
        continue
    all_transactions.append({
        'from_account': from_acc,
        'to_account': to_acc,
        'amount': float(np.random.uniform(1000, 50000)),
        'timestamp': datetime(2026, 5, 24, 11, 30, 0) + timedelta(seconds=random.randint(0, 100)),
        'device_id': f"dev_{random.randint(1, 30)}",
        'phone': fake.phone_number()[:10]
    })

# ---------- CREATE TRANSACTION NODES & RELATIONSHIPS ----------
def create_transactions_batch(tx, batch):
    query = """
    UNWIND $batch AS row
    MATCH (from:Account {account_id: row.from_id})
    MATCH (to:Account {account_id: row.to_id})
    CREATE (t:Transaction {
        amount: row.amount,
        timestamp: row.timestamp,
        device_id: row.device_id,
        phone: row.phone
    })
    CREATE (from)-[:PERFORMED]->(t)
    CREATE (t)-[:TO]->(to)
    """
    tx.run(query, batch=batch)

print("Creating Transaction nodes and edges...")
txs_batch = []
for tx in all_transactions:
    if tx['from_account'] is None or tx['to_account'] is None:
        continue
    ts_val = tx['timestamp'].isoformat() if hasattr(tx['timestamp'], 'isoformat') else str(tx['timestamp'])
    txs_batch.append({
        'from_id': int(tx['from_account']),
        'to_id': int(tx['to_account']),
        'amount': float(tx['amount']),
        'timestamp': ts_val,
        'device_id': str(tx['device_id']),
        'phone': str(tx['phone'])
    })

# Batch insert in chunks of 1000
chunk_size = 1000
with driver.session() as session:
    for i in range(0, len(txs_batch), chunk_size):
        chunk = txs_batch[i:i + chunk_size]
        session.execute_write(create_transactions_batch, chunk)

# ---------- CREATE SHARED ENTITY LINKS ----------
# For certain known mule accounts, explicitly link them via same device/phone
# to form a detectable ring. We'll pick a subset of real mules and assign them a shared device.
ring_mules = list(mule_ids[:5])  # first 5 mules
shared_device = "dev_ring_1"
shared_phone = "9999999999"
with driver.session() as session:
    for acc_id in ring_mules:
        session.run("""
        MATCH (a:Account {account_id: $acc_id})
        SET a.shared_device = $dev, a.shared_phone = $phone
        """, {'acc_id': int(acc_id), 'dev': shared_device, 'phone': shared_phone})
    # Also connect one synthetic account to this ring
    ring_synthetic = random.choice(synthetic_ids)
    session.run("""
    MATCH (a:Account {account_id: $acc_id})
    SET a.shared_device = $dev, a.shared_phone = $phone
    """, {'acc_id': ring_synthetic, 'dev': shared_device, 'phone': shared_phone})

print("Graph loading complete!")
driver.close()
