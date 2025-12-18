import json
from core.db_singleton import DatabaseConnection
from models.user import Userr 

class UserRepository:
    def __init__(self):
        self.db = DatabaseConnection().connection

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, role FROM userr")
        rows = cursor.fetchall()
        return [Userr(**row, password="") for row in rows] 

    def get_by_id(self, user_id: int) -> Userr | None:
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, role, password_hash AS password FROM userr WHERE user_id=%s", (user_id,))
        row = cursor.fetchone()
        return Userr(**row, is_hashed=True) if row else None

    def get_by_email(self, email: str) -> Userr | None:
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, role, password_hash AS password FROM userr WHERE email=%s", (email,))
        row = cursor.fetchone()
        return Userr(**row, is_hashed=True) if row else None

    def create(self, user: Userr) -> Userr:
        cursor = self.db.cursor()  
        sql = """
            INSERT INTO userr (name, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
        """
        values = (user.name, user.email, user.password_hash, user.role)
        print("DEBUG SQL:", sql)
        print("DEBUG VALUES COUNT:", len(values), values)
        cursor.execute(sql, values)
        self.db.commit()
        user.user_id = cursor.lastrowid 
        return user

    def update(self, user: Userr) -> Userr:
        cursor = self.db.cursor()
        sql = """
            UPDATE userr 
            SET name=%s, email=%s, password_hash=%s, role=%s
            WHERE user_id=%s
        """
        values = (user.name, user.email, user.password_hash, user.role, user.user_id)
        cursor.execute(sql, values)
        self.db.commit()
        return user

    def delete(self, user_id: int) -> bool:
        cursor = self.db.cursor()
        sql = "DELETE FROM userr WHERE user_id=%s"
        cursor.execute(sql, (user_id,))
        self.db.commit()
        return cursor.rowcount > 0