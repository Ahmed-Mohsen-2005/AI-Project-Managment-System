from models.report import Report
from core.db_singleton import DatabaseConnection

class ReportRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'report'
            cursor.execute("SELECT * FROM report")
            rows = cursor.fetchall()
            return [Report(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, report_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'report'
            cursor.execute("SELECT * FROM report WHERE report_id = %s", (report_id,))
            row = cursor.fetchone()
            return Report(**row) if row else None
        finally:
            cursor.close()
            conn.close()