from core.db_singleton import DatabaseConnection
from models.user_activity import UserActivity

class UserActivityRepository:
    def __init__(self):
        self._db_instance = DatabaseConnection()

    @property
    def db(self):
        return self._db_instance.get_connection()

    def get_by_user_id(self, user_id, limit=10):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT activity_id, user_id, action, timestamp
            FROM UserActivity
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """
        cursor.execute(query, (user_id, limit))
        rows = cursor.fetchall()
        cursor.close()
        return [UserActivity(**row) for row in rows]

    def create(self, activity: UserActivity):
        cursor = self.db.cursor()
        query = """
            INSERT INTO UserActivity (user_id, action, timestamp)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (activity.user_id, activity.action, activity.timestamp))
        self.db.commit()
        activity.activity_id = cursor.lastrowid
        cursor.close()
        return activity.activity_id

    def delete_old_activities(self, user_id, keep_count=50):
        cursor = self.db.cursor()
        query = """
            DELETE FROM UserActivity
            WHERE user_id = %s
            AND activity_id NOT IN (
                SELECT activity_id FROM (
                    SELECT activity_id FROM UserActivity
                    WHERE user_id = %s
                    ORDER BY timestamp DESC
                    LIMIT %s
                ) AS recent
            )
        """
        cursor.execute(query, (user_id, user_id, keep_count))
        self.db.commit()
        affected = cursor.rowcount
        cursor.close()
        return affected
