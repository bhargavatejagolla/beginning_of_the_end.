# backend/app/utils/graph_utils.py
from neo4j import GraphDatabase
from core.config import settings
from typing import List, Dict, Any

driver = GraphDatabase.driver(settings.NEO4J_URI, auth=(
    settings.NEO4J_USER, settings.NEO4J_PASSWORD))


def trace_funds(account_id: int) -> List[Dict[str, Any]]:
    """
    Trace incoming funds backwards from a mule account to find source accounts (victims).
    Returns list of {account_id, amount, bank, path_length}.
    """
    with driver.session() as session:
        query = """
        MATCH path = (src:Account)-[:PERFORMED]->(t:Transaction)-[:TO]->(mule:Account {account_id: $id})
        WHERE src <> mule
        RETURN src.account_id AS account_id, t.amount AS amount, src.bank AS bank, length(path) AS hops
        ORDER BY t.amount DESC
        LIMIT 20
        """
        result = session.run(query, id=int(account_id))
        return [record.data() for record in result]


def get_shared_entities(account_id: int) -> List[Dict[str, Any]]:
    """
    Find accounts sharing device/phone with the given account.
    """
    with driver.session() as session:
        query = """
        MATCH (a:Account {account_id: $id})
        WITH a.shared_device AS dev, a.shared_phone AS phone
        OPTIONAL MATCH (other:Account)
        WHERE (other.shared_device = dev OR other.shared_phone = phone) AND other.account_id <> $id
        RETURN other.account_id AS account_id, other.bank AS bank, other.is_mule AS is_mule, other.risk_score AS risk_score
        """
        result = session.run(query, id=int(account_id))
        return [record.data() for record in result]


def detect_fraud_rings() -> List[Dict[str, Any]]:
    """
    Use Louvain community detection (Neo4j GDS) to find dense clusters of mule accounts.
    Requires GDS plugin installed (Neo4j 5.20.0 community includes it).
    Returns top communities with high fraud ratio.
    """
    with driver.session() as session:
        # Create in-memory graph projection (if not exists)
        session.run("""
        CALL gds.graph.project(
            'fraud-graph',
            'Account',
            {TRANSFERRED: {type: 'PERFORMED', orientation: 'NATURAL'}},
            {nodeProperties: ['risk_score']}
        ) YIELD graphName
        """)
        # Run Louvain
        result = session.run("""
        CALL gds.louvain.stream('fraud-graph')
        YIELD nodeId, communityId
        WITH gds.util.asNode(nodeId) AS node, communityId
        RETURN communityId, collect(node.account_id)[0..10] AS members, avg(node.risk_score) AS avg_risk, count(*) AS size
        ORDER BY avg_risk DESC
        LIMIT 5
        """)
        communities = [record.data() for record in result]
        # Drop projection to free memory
        session.run("CALL gds.graph.drop('fraud-graph')")
        return communities
