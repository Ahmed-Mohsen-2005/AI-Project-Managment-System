from core.db_singleton import DatabaseConnection
from models.user import User

class UserRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()
    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email FROM users")
        rows = cursor.fetchall()
        return [User(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email FROM users WHERE id=%s", (id,))
        row = cursor.fetchone()
        return User(**row) if row else None