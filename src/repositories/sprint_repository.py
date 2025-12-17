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
        cursor.execute("SELECT sprint_id, project_id, name, start_date, end_date, velocity,status FROM Sprint")
        rows = cursor.fetchall()
        return [Sprint(**row) for row in rows]

    def get_by_project_id(self, project_id):
        cursor = self.db.cursor(dictionary=True)
        query = """
        SELECT sprint_id, project_id, name, start_date, end_date, velocity, status
        FROM Sprint 
        WHERE project_id = %s 
        ORDER BY start_date DESC
        """
        cursor.execute(query, (project_id,))
        rows = cursor.fetchall()
        return [Sprint(**row) for row in rows]
    def get_by_id(self, sprint_id):
        cursor = self.db.cursor(dictionary=True)
        # Added 'status' to the SELECT if you decide to add the column later
        query = "SELECT * FROM Sprint WHERE sprint_id = %s"
        cursor.execute(query, (sprint_id,))
        row = cursor.fetchone()
        if row:
            # We convert to Sprint model to use its .to_dict() method
            return Sprint(**row)
        return None

    def update(self, sprint_id, data):
        cursor = self.db.cursor()
        query = """
            UPDATE Sprint 
            SET name = %s, start_date = %s, end_date = %s 
            WHERE sprint_id = %s
        """
        values = (data['name'], data['start_date'], data['end_date'], sprint_id)
        cursor.execute(query, values)
        self.db.commit()
        return cursor.rowcount > 0

    def update_status(self, sprint_id, new_status):
        """
        NOTE: This requires a 'status' column in your Sprint table.
        If you don't have it, run: ALTER TABLE Sprint ADD COLUMN status VARCHAR(20) DEFAULT 'future';
        """
        cursor = self.db.cursor()
        query = "UPDATE Sprint SET status = %s WHERE sprint_id = %s"
        cursor.execute(query, (new_status, sprint_id))
        self.db.commit()
        return cursor.rowcount > 0