from core.db_singleton import DatabaseConnection
from models.sprint import Sprint

class SprintRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def create(self, sprint: Sprint):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            if not sprint.start_date:
                raise ValueError("Start Date is required")

            # FIX: 'Sprint' -> 'sprint'
            query = """
            INSERT INTO sprint (project_id, name, start_date, end_date, velocity) 
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
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: 'Sprint' -> 'sprint'
            cursor.execute("SELECT sprint_id, project_id, name, start_date, end_date, velocity, status FROM sprint")
            rows = cursor.fetchall()
            return [Sprint(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_project_id(self, project_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: 'Sprint' -> 'sprint'
            query = """
            SELECT sprint_id, project_id, name, start_date, end_date, velocity, status
            FROM sprint 
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
            # FIX: 'Sprint' -> 'sprint'
            query = "SELECT * FROM sprint WHERE sprint_id = %s"
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
            # FIX: 'Sprint' -> 'sprint'
            query = """
                UPDATE sprint 
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
            # FIX: 'Sprint' -> 'sprint'
            query = "UPDATE sprint SET status = %s WHERE sprint_id = %s"
            cursor.execute(query, (new_status, sprint_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()