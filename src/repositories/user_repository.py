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
        cursor = conn.cursor(dictionary=True)
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
            conn.commit()
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
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()

    def update_password(self, email: str, new_password_hash: str) -> bool:
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = "UPDATE userr SET password_hash = %s WHERE email = %s"
            cursor.execute(query, (new_password_hash, email))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def get_user_stats(self, user_id: int) -> dict:
        """Get performance statistics for a user."""
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Tasks completed this year
            cursor.execute("""
                SELECT COUNT(*) as count FROM Task
                WHERE assigned_id = %s AND status = 'DONE'
                AND YEAR(CURDATE()) = YEAR(CURDATE())
            """, (user_id,))
            tasks_completed = cursor.fetchone()['count']

            # Total tasks assigned
            cursor.execute("""
                SELECT COUNT(*) as count FROM Task
                WHERE assigned_id = %s
            """, (user_id,))
            total_tasks = cursor.fetchone()['count']

            # Completion rate (as velocity proxy)
            completion_rate = round((tasks_completed / total_tasks * 100) if total_tasks > 0 else 0, 1)

            # AI-related tasks
            cursor.execute("""
                SELECT COUNT(*) as count FROM Task
                WHERE assigned_id = %s AND title LIKE '%AI%'
            """, (user_id,))
            ai_tasks = cursor.fetchone()['count']

            # Calculate AI risk exposure (percentage of AI tasks)
            risk_exposure = round((ai_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)

            # Task rejection rate (simplified - tasks moved back from IN_REVIEW to TODO/IN_PROGRESS)
            # Since we don't track task history, we'll return 0 for now
            rejection_rate = "0%"

            return {
                "velocity": f"{completion_rate}%",
                "rejectionRate": rejection_rate,
                "riskExposure": f"{risk_exposure}%",
                "tasksCompleted": tasks_completed
            }
        finally:
            cursor.close()
            conn.close()