from models.integration import Integration, IntegrationType
from core.db_singleton import DatabaseConnection

class IntegrationRepository:
    def __init__(self):
        # Store the manager instance to access the connection pool
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT integration_id, type, authtoken, last_synced FROM Integration"
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Integration(**row) for row in rows]
        finally:
            # Crucial: Close both cursor and connection to avoid "Commands out of sync"
            cursor.close()
            conn.close()

    def get_by_id(self, integration_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT integration_id, type, authtoken, last_synced 
                FROM Integration 
                WHERE integration_id = %s
            """
            cursor.execute(query, (integration_id,))
            row = cursor.fetchone()
            return Integration(**row) if row else None
        finally:
            cursor.close()
            conn.close()