from models.sprint import Sprint
from core.db_singleton import DatabaseConnection

class SprintRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT sprint_id, project_id, name, start_date,end_date, velocity FROM Sprint")
        rows = cursor.fetchall()
        return [Sprint(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT sprint_id, project_id, name, start_date,end_date, velocity FROM Sprint WHERE id=%s", (id,))
        row = cursor.fetchone()
        return Sprint(**row) if row else None