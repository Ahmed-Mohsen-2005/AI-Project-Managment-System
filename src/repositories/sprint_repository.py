from core.db_singleton import DatabaseConnection
from models.sprint import Sprint

class SprintRepository:
    def __init__(self):
        # Store the manager, not the connection itself
        self.db_manager = DatabaseConnection()

    def create(self, sprint: Sprint):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            # Validation for start_date
            if not sprint.start_date:
                raise ValueError("Start Date is required")

            query = """
            INSERT INTO Sprint (project_id, name, start_date, end_date, velocity) 
            VALUES (%s, %s, %s, %s, %s)
            """
            values = (
                sprint.project_id, 
                sprint.name, 
                sprint.start_date, 
                sprint.end_date, 
                sprint.velocity if sprint.velocity else 0.00
            )
            
            cursor.execute(query, values)
            conn.commit() # Commit using the borrowed connection
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT sprint_id, project_id, name, start_date, end_date, velocity, status FROM Sprint")
            rows = cursor.fetchall()
            return [Sprint(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_project_id(self, project_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
            SELECT sprint_id, project_id, name, start_date, end_date, velocity, status
            FROM Sprint 
            WHERE project_id = %s 
            ORDER BY start_date DESC
            """
            cursor.execute(query, (project_id,))
            rows = cursor.fetchall()
            return [Sprint(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, sprint_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT * FROM Sprint WHERE sprint_id = %s"
            cursor.execute(query, (sprint_id,))
            row = cursor.fetchone()
            if row:
                return Sprint(**row)
            return None
        finally:
            cursor.close()
            conn.close()

    def update(self, sprint_id, data):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                UPDATE Sprint 
                SET name = %s, start_date = %s, end_date = %s 
                WHERE sprint_id = %s
            """
            values = (data['name'], data['start_date'], data['end_date'], sprint_id)
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def update_status(self, sprint_id, new_status):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = "UPDATE Sprint SET status = %s WHERE sprint_id = %s"
            cursor.execute(query, (new_status, sprint_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()