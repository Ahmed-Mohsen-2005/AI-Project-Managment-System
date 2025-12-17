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

    def update(self, user: Userr) -> int:
        cursor = self.db.cursor()
        sql = """
            UPDATE userr
            SET name = %s, email = %s, role = %s
            WHERE user_id = %s
        """
        cursor.execute(sql, (user.name, user.email, user.role, user.user_id))
        self.db.commit()
        affected = cursor.rowcount
        cursor.close()
        return affected

    def get_user_stats(self, user_id: int) -> dict:
        cursor = self.db.cursor(dictionary=True)

        # Get completed tasks count
        cursor.execute("""
            SELECT COUNT(*) as completed_count
            FROM Task
            WHERE assigned_id = %s AND status = 'DONE'
        """, (user_id,))
        completed_result = cursor.fetchone()
        tasks_completed = completed_result['completed_count'] if completed_result else 0

        # Get total tasks count
        cursor.execute("""
            SELECT COUNT(*) as total_count
            FROM Task
            WHERE assigned_id = %s
        """, (user_id,))
        total_result = cursor.fetchone()
        total_tasks = total_result['total_count'] if total_result else 0

        # Calculate velocity (completion rate)
        velocity = round((tasks_completed / total_tasks * 100), 1) if total_tasks > 0 else 0

        # Get overdue tasks for rejection rate calculation
        cursor.execute("""
            SELECT COUNT(*) as overdue_count
            FROM Task
            WHERE assigned_id = %s AND due_date < CURDATE() AND status != 'DONE'
        """, (user_id,))
        overdue_result = cursor.fetchone()
        overdue_tasks = overdue_result['overdue_count'] if overdue_result else 0

        rejection_rate = round((overdue_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

        cursor.close()

        return {
            "velocity": f"{velocity}%",
            "rejectionRate": f"{rejection_rate}%",
            "riskExposure": "0%",  # Placeholder for AI risk exposure
            "tasksCompleted": tasks_completed
        }