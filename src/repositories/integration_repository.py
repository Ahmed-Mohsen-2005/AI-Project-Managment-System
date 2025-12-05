from models.integration import Integration, IntegrationType
from core.db_singleton import DatabaseConnection
class IntegrationRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT integration_id, type, authtoken,last_synced FROM Integration")
        rows = cursor.fetchall()
        return [Integration(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT integration_id, type, authtoken,last_synced FROM Integration WHERE integration_id=%s", (id,))
        row = cursor.fetchone()
        return Integration(**row) if row else None