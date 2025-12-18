from models.report import Report
from core.db_singleton import DatabaseConnection

class ReportRepository:
    def __init__(self):
        # Store the manager instance to get fresh connections from the pool
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT report_id, sprint_id, project_id, content, title, author, created_at, updated_at 
                FROM Report
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Report(**row) for row in rows]
        finally:
            # Return connection to the pool immediately
            cursor.close()
            conn.close()

    def get_by_id(self, report_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Fixed the WHERE clause to use report_id
            query = """
                SELECT report_id, sprint_id, project_id, content, title, author, created_at, updated_at 
                FROM Report 
                WHERE report_id = %s
            """
            cursor.execute(query, (report_id,))
            row = cursor.fetchone()
            return Report(**row) if row else None
        finally:
            cursor.close()
            conn.close()