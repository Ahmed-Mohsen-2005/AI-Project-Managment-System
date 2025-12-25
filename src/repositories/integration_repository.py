from models.integration import Integration, IntegrationType
from core.db_singleton import DatabaseConnection

class IntegrationRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'integration'
            cursor.execute("SELECT integration_id, type, authtoken, last_synced FROM integration")
            rows = cursor.fetchall()
            return [Integration(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, integration_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'integration'
            cursor.execute("SELECT * FROM integration WHERE integration_id = %s", (integration_id,))
            row = cursor.fetchone()
            return Integration(**row) if row else None
        finally:
            cursor.close()
            conn.close()