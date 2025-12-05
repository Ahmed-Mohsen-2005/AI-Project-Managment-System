from models.task import Task
from core.db_singleton import DatabaseConnection


class TaskRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id FROM Task")
        rows = cursor.fetchall()
        return [Task(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id FROM Task WHERE id=%s", (id,))
        row = cursor.fetchone()
        return Task(**row) if row else None