import json
from datetime import date
from core.db_singleton import DatabaseConnection
from models.task import Task

class TaskRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id FROM Task"
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Task(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, task_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id FROM Task WHERE task_id=%s", (task_id,))
            row = cursor.fetchone()
            return Task(**row) if row else None
        finally:
            cursor.close()
            conn.close()

    def add_task(self, task: Task):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
            INSERT INTO Task (sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                task.sprint_id, task.title, task.status.value, task.priority.value,
                task.estimate_hours, task.due_date, task.created_by, task.assigned_id
            ))
            conn.commit() # Using borrowed connection to commit
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def update_task(self, task: Task):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                UPDATE Task
                SET sprint_id=%s, title=%s, status=%s, priority=%s, estimate_hours=%s,
                    due_date=%s, assigned_id=%s
                WHERE task_id=%s
            """
            cursor.execute(query, (
                task.sprint_id, task.title, task.status.value, task.priority.value,
                task.estimate_hours, task.due_date, task.assigned_id, task.task_id
            ))
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()

    def delete_task(self, task_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM Task WHERE task_id=%s", (task_id,))
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()

    def get_user_recent_tasks(self, user_id, limit=5):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id
                FROM Task
                WHERE assigned_id = %s
                ORDER BY due_date DESC LIMIT %s
            """
            cursor.execute(query, (user_id, limit))
            rows = cursor.fetchall()
            return [Task(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_user_overdue_tasks(self, user_id: int):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id
                FROM Task
                WHERE assigned_id = %s AND due_date < %s
                ORDER BY due_date ASC
            """
            cursor.execute(query, (user_id, date.today()))
            rows = cursor.fetchall()
            return [Task(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_backlog_tasks(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT task_id, sprint_id, title, status, priority, estimate_hours,
                       due_date, created_by, assigned_id
                FROM Task ORDER BY task_id DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Task(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_sprint_id(self, sprint_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
            SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
                   due_date, created_by, assigned_id
            FROM Task WHERE sprint_id = %s ORDER BY priority DESC, due_date ASC
            """
            cursor.execute(query, (sprint_id,))
            rows = cursor.fetchall()
            return [Task(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()
