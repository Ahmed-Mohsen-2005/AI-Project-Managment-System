from models.project import Project
from core.db_singleton import DatabaseConnection
class ProjectRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT project_id, name, description, start_date, end_date, budget FROM Project")
        rows = cursor.fetchall()
        return [Project(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT project_id, name, description, start_date, end_date, budget FROM Project WHERE id=%s", (id,))
        row = cursor.fetchone()
        return Project(**row) if row else None