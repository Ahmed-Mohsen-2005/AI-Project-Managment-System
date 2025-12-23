import json
from core.db_singleton import DatabaseConnection
from models.user import Userr

class UserRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT user_id, name, email, role FROM userr")
            rows = cursor.fetchall()
            
            users = []
            for row in rows:
                user = Userr(
                    user_id=row['user_id'],
                    name=row['name'],
                    email=row['email'],
                    role=row['role'],
                    password="", 
                    type="standard",  # Default type since not in DB
                    is_hashed=True  
                )
                users.append(user)
            return users
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, user_id: int) -> Userr | None:
        conn = self.db_manager.get_connection()
        # Added dictionary=True here so you can use Userr(**row)
        cursor = conn.cursor(dictionary=True) 
        try:
            cursor.execute("SELECT user_id, name, email, type, role, password_hash AS password FROM userr WHERE user_id=%s", (user_id,))
            row = cursor.fetchone()
            return Userr(**row, is_hashed=True) if row else None
        finally:
            cursor.close()
            conn.close()

    def get_by_email(self, email: str) -> Userr | None:
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True) # Added dictionary=True
        try:
            cursor.execute("SELECT user_id, name, email, type, role, password_hash AS password FROM userr WHERE email=%s", (email,))
            row = cursor.fetchone()
            return Userr(**row, is_hashed=True) if row else None
        finally:
            cursor.close()
            conn.close()

    def create(self, user: Userr) -> Userr:
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            sql = """
                INSERT INTO userr (name, email, password_hash, role)
                VALUES (%s, %s, %s, %s)
            """
            values = (user.name, user.email, user.password_hash, user.role)
            cursor.execute(sql, values)
            conn.commit()  # CHANGED: use conn.commit(), not self.db.commit()
            user.user_id = cursor.lastrowid 
            return user
        finally:
            cursor.close()
            conn.close()

    def update(self, user: Userr):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
            UPDATE userr 
            SET name = %s, email = %s, role = %s
            WHERE user_id = %s
            """
            cursor.execute(query, (user.name, user.email, user.role, user.user_id))
            conn.commit()  # CHANGED: use conn.commit(), not self.db.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()
    # In repositories/user_repository.py

    # In repositories/user_repository.py

    def update_password(self, email: str, new_password_hash: str) -> bool:
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            # Note: 'userr' table as per your previous code
            query = "UPDATE userr SET password_hash = %s WHERE email = %s"
            cursor.execute(query, (new_password_hash, email))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()