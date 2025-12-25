from core.db_singleton import DatabaseConnection
from models.user_activity import UserActivity

class UserActivityRepository:
    def __init__(self):
        # FIX: Removed the unsafe @property db
        self.db_manager = DatabaseConnection()

    def get_by_user_id(self, user_id, limit=10):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'user_activity'
            query = """
                SELECT activity_id, user_id, action, timestamp
                FROM user_activity
                WHERE user_id = %s
                ORDER BY timestamp DESC
                LIMIT %s
            """
            cursor.execute(query, (user_id, limit))
            rows = cursor.fetchall()
            return [UserActivity(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def create(self, activity: UserActivity):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = "INSERT INTO user_activity (user_id, action, timestamp) VALUES (%s, %s, %s)"
            cursor.execute(query, (activity.user_id, activity.action, activity.timestamp))
            conn.commit()
            activity.activity_id = cursor.lastrowid
            return activity.activity_id
        finally:
            cursor.close()
            conn.close()

    def delete_old_activities(self, user_id, keep_count=50):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                DELETE FROM user_activity
                WHERE user_id = %s
                AND activity_id NOT IN (
                    SELECT activity_id FROM (
                        SELECT activity_id FROM user_activity
                        WHERE user_id = %s
                        ORDER BY timestamp DESC
                        LIMIT %s
                    ) AS recent
                )
            """
            cursor.execute(query, (user_id, user_id, keep_count))
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()