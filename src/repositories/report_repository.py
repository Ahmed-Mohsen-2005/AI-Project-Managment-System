from models.report import Report
from core.db_singleton import DatabaseConnection

class ReportRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT report_id, sprint_id, project_id,content,title,author,created_at,updated_at FROM Report")
        rows = cursor.fetchall()
        return [Report(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT report_id, sprint_id, project_id,content,title,author,created_at,updated_at FROM Report WHERE id=%s", (id,))
        row = cursor.fetchone()
        return Report(**row) if row else None