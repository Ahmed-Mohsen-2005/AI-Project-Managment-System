from models.project import Project
from core.db_singleton import DatabaseConnection

class ProjectRepository:
    def __init__(self):
        # Store the manager instance, not a single connection
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT project_id, name, description, start_date, end_date, budget FROM Project ORDER BY name ASC"
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Project(**row) for row in rows]
        finally:
            # Always return connection to the pool
            cursor.close()
            conn.close()

    def get_by_id(self, id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT project_id, name, description, start_date, end_date, budget FROM Project WHERE project_id=%s", 
                (id,)
            )
            row = cursor.fetchone()
            return Project(**row) if row else None
        finally:
            cursor.close()
            conn.close()

    def create(self, project: Project):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
            INSERT INTO Project (name, description, start_date, end_date, budget) 
            VALUES (%s, %s, %s, %s, %s)
            """
            values = (
                project.name, 
                project.description, 
                project.start_date, 
                project.end_date, 
                project.budget
            )
            cursor.execute(query, values)
            conn.commit()  # Use the local connection object for commit
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()