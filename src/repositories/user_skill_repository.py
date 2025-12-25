from core.db_singleton import DatabaseConnection
from models.user_skill import UserSkill

class UserSkillRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_by_user_id(self, user_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT skill_id, user_id, skill_name, skill_level
                FROM userskill
                WHERE user_id = %s
                ORDER BY skill_level DESC
            """
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            return [UserSkill(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def create(self, skill: UserSkill):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                INSERT INTO userskill (user_id, skill_name, skill_level)
                VALUES (%s, %s, %s)
            """
            cursor.execute(query, (skill.user_id, skill.skill_name, skill.skill_level))
            conn.commit()
            skill.skill_id = cursor.lastrowid
            return skill.skill_id
        finally:
            cursor.close()
            conn.close()

    def delete(self, skill_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM userskill WHERE skill_id = %s", (skill_id,))
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()

    def delete_by_user_and_name(self, user_id, skill_name):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM userskill WHERE user_id = %s AND skill_name = %s", (user_id, skill_name))
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()

    def update(self, skill: UserSkill):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                UPDATE userskill
                SET skill_name = %s, skill_level = %s
                WHERE skill_id = %s
            """
            cursor.execute(query, (skill.skill_name, skill.skill_level, skill.skill_id))
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()
