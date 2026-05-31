import aiosqlite
from datetime import datetime
from core.config import settings


class CaseManager:
    def __init__(self):
        self.db_path = settings.DATABASE_URL.replace("sqlite:///", "")

    async def init_db(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                CREATE TABLE IF NOT EXISTS cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id TEXT,
                    risk_score REAL,
                    risk_level TEXT,
                    status TEXT DEFAULT 'Open',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            await db.commit()

    async def create_case(self, account_id: str, risk_score: float, risk_level: str):
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "INSERT INTO cases (account_id, risk_score, risk_level) VALUES (?, ?, ?)",
                (account_id, risk_score, risk_level)
            )
            await db.commit()
            return cursor.lastrowid

    async def update_case(self, case_id: int, status: str = None, notes: str = None):
        async with aiosqlite.connect(self.db_path) as db:
            if status:
                await db.execute("UPDATE cases SET status=? WHERE id=?", (status, case_id))
            if notes:
                await db.execute("UPDATE cases SET notes=? WHERE id=?", (notes, case_id))
            await db.execute("UPDATE cases SET updated_at=CURRENT_TIMESTAMP WHERE id=?", (case_id,))
            await db.commit()

    async def get_cases(self):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM cases ORDER BY created_at DESC")
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]


case_manager = CaseManager()
