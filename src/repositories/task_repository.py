from models.task import Task
from core.db_singleton import DatabaseConnection
from datetime import date
import mysql.connector

class TaskRepository:
    def __init__(self):
        self.db = None
        self._get_connection()
    
    def _get_connection(self):
        """Get a fresh connection from the pool"""
        try:
            self.db = DatabaseConnection().get_connection()
        except Exception as e:
            print(f"[ERROR] Failed to get database connection: {e}")
            raise

    def _execute_query(self, query, params=None, fetch_one=False, fetch_all=False, commit=False):
        """
        Centralized query execution with proper error handling and cursor management
        """
        cursor = None
        try:
            # Get fresh connection for each query
            self._get_connection()
            cursor = self.db.cursor(dictionary=True, buffered=True)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            result = None
            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall()
            elif commit:
                self.db.commit()
                result = cursor.lastrowid if cursor.lastrowid else cursor.rowcount
            
            return result
            
        except mysql.connector.Error as err:
            print(f"[ERROR] Database error: {err}")
            if commit and self.db:
                self.db.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

    def get_all(self):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        """
        rows = self._execute_query(query, fetch_all=True)
        return [Task(**row) for row in rows] if rows else []
    
    def get_by_id(self, task_id):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id 
        FROM Task 
        WHERE task_id=%s
        """
        row = self._execute_query(query, (task_id,), fetch_one=True)
        return Task(**row) if row else None
    
    def get_by_sprint(self, sprint_id):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        WHERE sprint_id = %s
        ORDER BY due_date ASC
        """
        rows = self._execute_query(query, (sprint_id,), fetch_all=True)
        return [Task(**row) for row in rows] if rows else []
    
    def add_task(self, task: Task):
        query = """
        INSERT INTO Task (sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            task.sprint_id, task.title, task.status.value, task.priority.value,
            task.estimate_hours, task.due_date, task.created_by, task.assigned_id
        )
        return self._execute_query(query, params, commit=True)
    
    def update_task(self, task: Task):
        query = """
        UPDATE Task
        SET sprint_id=%s, title=%s, status=%s, priority=%s, estimate_hours=%s,
            due_date=%s, assigned_id=%s
        WHERE task_id=%s
        """
        params = (
            task.sprint_id, task.title, task.status.value, task.priority.value,
            task.estimate_hours, task.due_date, task.assigned_id, task.task_id
        )
        return self._execute_query(query, params, commit=True)
    
    def delete_task(self, task_id):
        query = "DELETE FROM Task WHERE task_id=%s"
        return self._execute_query(query, (task_id,), commit=True)
    
    def get_user_recent_tasks(self, user_id, limit=5):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        WHERE assigned_id = %s
        ORDER BY due_date DESC
        LIMIT %s
        """
        rows = self._execute_query(query, (user_id, limit), fetch_all=True)
        return [Task(**row) for row in rows] if rows else []

    def get_user_overdue_tasks(self, user_id: int):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        WHERE assigned_id = %s AND due_date < %s
        ORDER BY due_date ASC
        """
        rows = self._execute_query(query, (user_id, date.today()), fetch_all=True)
        return [Task(**row) for row in rows] if rows else []

    def get_tasks_by_status(self, status: str):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        WHERE status = %s
        ORDER BY due_date DESC
        """
        rows = self._execute_query(query, (status,), fetch_all=True)
        return [Task(**row) for row in rows] if rows else []

    def get_upcoming_tasks(self, user_id=None, limit=5):
        base_query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        WHERE due_date IS NOT NULL
          AND due_date >= %s
          AND status != 'DONE'
        """
        params = [date.today()]

        if user_id:
            base_query += " AND assigned_id = %s"
            params.append(user_id)

        base_query += " ORDER BY due_date ASC LIMIT %s"
        params.append(limit)

        rows = self._execute_query(base_query, params, fetch_all=True)
        return [Task(**row) for row in rows] if rows else []

    def get_backlog_tasks(self, project_id=None):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours,
               due_date, created_by, assigned_id
        FROM Task
        WHERE sprint_id IS NULL
        """
        rows = self._execute_query(query, fetch_all=True)
        return [Task(**row) for row in rows] if rows else []
    
    def get_by_sprint_id(self, sprint_id):
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        WHERE sprint_id = %s
        ORDER BY priority DESC, due_date ASC
        """
        rows = self._execute_query(query, (sprint_id,), fetch_all=True)
        return [Task(**row) for row in rows] if rows else []