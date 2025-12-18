import json
from core.db_singleton import DatabaseConnection
from models.user import Userr 

class UserRepository:
    def __init__(self):
        self.db = DatabaseConnection().connection

    def get_all(self):
        try:
        # Check if connection is alive; if not, attempt to reconnect
            if not self.db.is_connected():
                self.db.reconnect(attempts=3, delay=1)
        except Exception:
        # If the ping itself fails (the IndexError you saw), force reconnect
            self.db.reconnect(attempts=3, delay=1)
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT user_id, name, email, role FROM userr")
        rows = cursor.fetchall()
        
        # Create Userr objects without password for get_all
        users = []
        for row in rows:
            # Add a dummy password since Userr requires it
            user = Userr(
                user_id=row['user_id'],
                name=row['name'],
                email=row['email'],
                role=row['role'],
                password="",  # Empty password for listing
                is_hashed=True  # Treat empty string as already hashed
            )
            users.append(user)
        
        return users 

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
    


    def update(self, user: Userr):
        """Update an existing user"""
        cursor = self.db.cursor()
        query = """
        UPDATE userr 
        SET name = %s, email = %s, role = %s 
        WHERE user_id = %s
        """
        cursor.execute(query, (user.name, user.email, user.role, user.user_id))
        self.db.commit()
        return cursor.rowcount