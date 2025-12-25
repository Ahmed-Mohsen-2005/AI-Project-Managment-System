from models.project import Project
from core.db_singleton import DatabaseConnection
from datetime import date

class ProjectRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: 'Project' -> 'project'
            query = "SELECT project_id, name, description, start_date, end_date, budget FROM project ORDER BY name ASC"
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Project(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: 'Project' -> 'project'
            cursor.execute(
                "SELECT project_id, name, description, start_date, end_date, budget FROM project WHERE project_id=%s", 
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
            # FIX: 'Project' -> 'project'
            query = """
            INSERT INTO project (name, description, start_date, end_date, budget) 
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
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def get_user_projects(self, user_id):
        """Get projects assigned to a specific user via user_project join"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: 'Project' -> 'project'
            # FIX: 'project_user' -> 'user_project' (Based on your screenshot)
            cursor.execute("""
                SELECT p.project_id, p.name, p.description, p.start_date, p.end_date, p.budget
                FROM project p
                INNER JOIN user_project pu ON p.project_id = pu.project_id
                WHERE pu.user_id = %s
                ORDER BY p.name ASC
            """, (user_id,))
            rows = cursor.fetchall()
            print(f"[PROJECT_REPO] Found {len(rows)} projects for user {user_id}")
            return [Project(**row) for row in rows]
        except Exception as e:
            print(f"[PROJECT_REPO] Error in get_user_projects: {e}")
            return []
        finally:
            cursor.close()
            conn.close()