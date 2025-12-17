from models.task import Task
from core.db_singleton import DatabaseConnection
from datetime import date

class TaskRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()

    
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        # Ensure all columns are fetched for the Task model
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        # NOTE: Task model's __init__ must handle string/enum conversion for status/priority
        return [Task(**row) for row in rows]
    
    def get_by_id(self, task_id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id FROM Task WHERE task_id=%s", (task_id,))
        row = cursor.fetchone()
        return Task(**row) if row else None
    
    def get_by_sprint(self, sprint_id):
        """
        Fetch all tasks for a specific sprint/project.
        :param sprint_id: ID of the sprint
        :return: List of Task objects
        """
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id
            FROM Task
            WHERE sprint_id = %s
            ORDER BY due_date ASC
        """
        cursor.execute(query, (sprint_id,))
        rows = cursor.fetchall()
        cursor.close()
        return [Task(**row) for row in rows]
    
    def add_task(self, task: Task):
        cursor = self.db.cursor()

        query = """
        INSERT INTO Task (sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(query,(
        task.sprint_id, task.title, task.status.value, task.priority.value,
        task.estimate_hours, task.due_date, task.created_by, task.assigned_id
        ))
        self.db.commit()
        return cursor.lastrowid
    
    def update_task(self, task: Task):
        cursor = self.db.cursor(dictionary=True)
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
        self.db.commit()
        return cursor.rowcount
    
    def delete_task(self, task_id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("DELETE FROM Task WHERE task_id=%s", (task_id,))
        self.db.commit()
        return cursor.rowcount  
    
    def get_user_recent_tasks(self, user_id, limit=5):
        """
        Fetch the most recent tasks assigned to a specific user, ordered by due_date descending.
        :param user_id: ID of the assigned user
        :param limit: Maximum number of tasks to fetch
        :return: List of Task objects
        """
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id
            FROM Task
            WHERE assigned_id = %s
            ORDER BY due_date DESC
            LIMIT %s
        """
        cursor.execute(query, (user_id, limit))
        rows = cursor.fetchall()
        cursor.close()
        return [Task(**row) for row in rows]


    # Fetch overdue tasks for a specific user
    def get_user_overdue_tasks(self, user_id: int):
        """
        Fetch tasks assigned to a user that are past their due date.
        :param user_id: ID of the assigned user
        :return: List of Task objects
        """
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id
            FROM Task
            WHERE assigned_id = %s AND due_date < %s
            ORDER BY due_date ASC
        """
        cursor.execute(query, (user_id, date.today()))
        rows = cursor.fetchall()
        cursor.close()
        return [Task(**row) for row in rows]


    # Fetch tasks filtered by status
    def get_tasks_by_status(self, status: str):
        """
        Fetch all tasks with the specified status.
        :param status: Task status (e.g., 'Pending', 'Completed')
        :return: List of Task objects
        """
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id
            FROM Task
            WHERE status = %s
            ORDER BY due_date DESC
        """
        cursor.execute(query, (status,))
        rows = cursor.fetchall()
        cursor.close()
        return [Task(**row) for row in rows]

    def get_upcoming_tasks(self, user_id=None, limit=5):
        """
        Fetch the upcoming tasks ordered by the closest due date.
        Optionally filter by assigned user.
        """
        cursor = self.db.cursor(dictionary=True)
        base_query = """
            SELECT task_id, sprint_id, title, status, priority, estimate_hours, due_date, created_by, assigned_id
            FROM Task
            WHERE due_date IS NOT NULL
              AND due_date >= %s
              AND status != 'DONE'
        """
        params = [date.today()]

        if user_id:
            base_query += " AND assigned_id = %s"
            params.append(user_id)

    def get_backlog_tasks(self, project_id=None):
        cursor = self.db.cursor(dictionary=True)

        query = """
            SELECT task_id, sprint_id, title, status, priority, estimate_hours,
                   due_date, created_by, assigned_id
            FROM Task
            
        """

        params = ()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        cursor.close()

        return [Task(**row) for row in rows]
    def get_by_sprint_id(self, sprint_id):
        """Fetches all tasks belonging to a specific sprint."""
        cursor = self.db.cursor(dictionary=True)
        query = """
        SELECT task_id, sprint_id, title, status, priority, estimate_hours, 
               due_date, created_by, assigned_id
        FROM Task
        WHERE sprint_id = %s
        ORDER BY priority DESC, due_date ASC
        """
        cursor.execute(query, (sprint_id,))
        rows = cursor.fetchall()
        return [Task(**row) for row in rows]
