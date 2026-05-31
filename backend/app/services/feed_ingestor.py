from utils.websocket_manager import manager


stored_alerts = []

class FeedIngestor:
    def __init__(self):
        # In production, this would query a database; for now we use an in-memory map
        self.phone_to_accounts = {}   # phone -> list of account_ids

    async def ingest(self, alert: dict):
        stored_alerts.append(alert)
        # alert format: {"phone": "98765XXXXX", "fraud_type": "SIM Swap"}
        phone = alert.get("phone")
        # find accounts linked (hardcoded for demo; you can pre-populate)
        affected_accounts = self.phone_to_accounts.get(phone, [])
        for acct in affected_accounts:
            await manager.broadcast({
                "type": "regulatory_alert",
                "data": {
                    "phone": phone,
                    "account_id": acct,
                    "message": f"Re-score triggered by I4C alert: {alert.get('fraud_type')}"
                }
            })


feed_ingestor = FeedIngestor()
