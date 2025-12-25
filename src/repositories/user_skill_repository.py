from core.db_singleton import DatabaseConnection
from models.user_skill import UserSkill

class UserSkillRepository:
    def __init__(self):
        # FIX: Do not use @property for db connection, it causes leaks
        self.db_manager = DatabaseConnection()

    def get_by_user_id(self, user_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'user_skills'
            query = """
                SELECT skill_id, user_id, skill_name, skill_level
                FROM user_skills
                WHERE user_id = %s
                ORDER BY skill_level DESC
            """
            cursor.execute(query, (user_id,))
            rows = cursor.fetchall()
            return [UserSkill(**row) for row in rows]
        finally:
            cursor.close()
            conn.close() # FIX: Must close connection!

    def create(self, skill: UserSkill):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = "INSERT INTO user_skills (user_id, skill_name, skill_level) VALUES (%s, %s, %s)"
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
            cursor.execute("DELETE FROM user_skills WHERE skill_id = %s", (skill_id,))
            conn.commit()
            return cursor.rowcount
        finally:
            cursor.close()
            conn.close()