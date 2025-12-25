from models.notification import notification
from core.db_singleton import DatabaseConnection

class NotificationRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'notification'
            cursor.execute("SELECT notification_id, user_id, message, channel, sent_at FROM notification")
            rows = cursor.fetchall()
            return [notification(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, notification_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'notification'
            cursor.execute("SELECT * FROM notification WHERE notification_id = %s", (notification_id,))
            row = cursor.fetchone()
            return notification(**row) if row else None
        finally:
            cursor.close()
            conn.close()