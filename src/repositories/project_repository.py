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
            # ✅ ADDED: github_repo
            query = "SELECT project_id, name, description, start_date, end_date, budget, github_repo FROM project ORDER BY name ASC"
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
            # ✅ ADDED: github_repo
            cursor.execute(
                "SELECT project_id, name, description, start_date, end_date, budget, github_repo FROM project WHERE project_id=%s", 
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
            # ✅ ADDED: github_repo to INSERT
            query = """
            INSERT INTO project (name, description, start_date, end_date, budget, github_repo) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            # Safely get github_repo if it exists on the object, else None
            gh_repo = getattr(project, 'github_repo', None)
            
            values = (
                project.name, 
                project.description, 
                project.start_date, 
                project.end_date, 
                project.budget,
                gh_repo
            )
            cursor.execute(query, values)
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def update_repo_link(self, project_id, repo_name):
        """
        ✅ NEW METHOD: Links a specific GitHub repo (e.g. 'ahmed/backend') 
        to a project without changing other details.
        """
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = "UPDATE project SET github_repo = %s WHERE project_id = %s"
            cursor.execute(query, (repo_name, project_id))
            conn.commit()
            return cursor.rowcount
        except Exception as e:
            print(f"[PROJECT_REPO] Error linking repo: {e}")
            return 0
        finally:
            cursor.close()
            conn.close()

    def get_user_projects(self, user_id):
        """Get projects assigned to a specific user via user_project join"""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # ✅ ADDED: github_repo
            cursor.execute("""
                SELECT p.project_id, p.name, p.description, p.start_date, p.end_date, p.budget, p.github_repo
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