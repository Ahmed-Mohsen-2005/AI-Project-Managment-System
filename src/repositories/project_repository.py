from models.project import Project
from core.db_singleton import DatabaseConnection

class ProjectRepository:
    def __init__(self):
        # Ensure this matches your DB Singleton fix from the previous step
        self.db = DatabaseConnection().get_connection() 

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        query = "SELECT project_id, name FROM Project ORDER BY name ASC"
        cursor.execute(query)
        rows = cursor.fetchall()
        return rows

    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT project_id, name, description, start_date, end_date, budget FROM Project WHERE project_id=%s", (id,))
        row = cursor.fetchone()
        return Project(**row) if row else None

    def create(self, project: Project):
        cursor = self.db.cursor()
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
        self.db.commit()
        return cursor.lastrowid