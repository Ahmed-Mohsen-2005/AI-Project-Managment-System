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
    def create(self, task: Task):
        cursor = self.db.cursor()
        cursor.execute(
            "INSERT INTO Task (sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (task.sprint_id, task.title, task.status, task.priority, task.estimate_hours, task.due_date, task.created_by, task.assigned_id)
        )
        self.db.commit()
        task.task_id = cursor.lastrowid
        return task