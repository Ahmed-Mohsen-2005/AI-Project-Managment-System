from core.db_singleton import DatabaseConnection
from models.sprint import Sprint

class SprintRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()

    def create(self, sprint: Sprint):
        cursor = self.db.cursor()
        
        # 1. INSERT: No 'status' column here
        query = """
        INSERT INTO Sprint (project_id, name, start_date, end_date, velocity) 
        VALUES (%s, %s, %s, %s, %s)
        """
        
        # Validation for start_date
        if not sprint.start_date:
            raise ValueError("Start Date is required")

        values = (
            sprint.project_id, 
            sprint.name, 
            sprint.start_date, 
            sprint.end_date, 
            sprint.velocity if sprint.velocity else 0.00
        )
        
        cursor.execute(query, values)
        self.db.commit()
        
        return cursor.lastrowid

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT sprint_id, project_id, name, start_date, end_date, velocity FROM Sprint")
        rows = cursor.fetchall()
        return [Sprint(**row) for row in rows]

    def get_by_project_id(self, project_id):
        cursor = self.db.cursor(dictionary=True)
        query = """
        SELECT sprint_id, project_id, name, start_date, end_date, velocity 
        FROM Sprint 
        WHERE project_id = %s 
        ORDER BY start_date DESC
        """
        cursor.execute(query, (project_id,))
        rows = cursor.fetchall()
        return [Sprint(**row) for row in rows]