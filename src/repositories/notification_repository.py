from models.notification import notification
from core.db_singleton import DatabaseConnection
class NotificationRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT notification_id, user_id, message, channel, sent_at FROM Notification")
        rows = cursor.fetchall()
        return [notification(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT notification_id, user_id, message, channel, sent_at FROM Notification WHERE id=%s", (id,))
        row = cursor.fetchone()
        return notification(**row) if row else None
