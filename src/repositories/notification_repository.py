from models.notification import notification
from core.db_singleton import DatabaseConnection

class NotificationRepository:
    def __init__(self):
        # Initialize with the manager to enable connection pooling
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT notification_id, user_id, message, channel, sent_at FROM Notification"
            cursor.execute(query)
            rows = cursor.fetchall()
            return [notification(**row) for row in rows]
        finally:
            # Ensure resources are released
            cursor.close()
            conn.close()

    def get_by_id(self, notification_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Fixed column name to notification_id for consistency
            query = """
                SELECT notification_id, user_id, message, channel, sent_at 
                FROM Notification 
                WHERE notification_id = %s
            """
            cursor.execute(query, (notification_id,))
            row = cursor.fetchone()
            return notification(**row) if row else None
        finally:
            cursor.close()
            conn.close()