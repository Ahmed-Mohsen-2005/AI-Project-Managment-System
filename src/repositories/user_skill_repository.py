from core.db_singleton import DatabaseConnection
from models.user_skill import UserSkill

class UserSkillRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()

    def get_by_user_id(self, user_id):
        cursor = self.db.cursor(dictionary=True)
        query = """
            SELECT skill_id, user_id, skill_name, skill_level
            FROM UserSkill
            WHERE user_id = %s
            ORDER BY skill_level DESC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        cursor.close()
        return [UserSkill(**row) for row in rows]

    def create(self, skill: UserSkill):
        cursor = self.db.cursor()
        query = """
            INSERT INTO UserSkill (user_id, skill_name, skill_level)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (skill.user_id, skill.skill_name, skill.skill_level))
        self.db.commit()
        skill.skill_id = cursor.lastrowid
        cursor.close()
        return skill.skill_id

    def delete(self, skill_id):
        cursor = self.db.cursor()
        cursor.execute("DELETE FROM UserSkill WHERE skill_id = %s", (skill_id,))
        self.db.commit()
        affected = cursor.rowcount
        cursor.close()
        return affected

    def delete_by_user_and_name(self, user_id, skill_name):
        cursor = self.db.cursor()
        cursor.execute("DELETE FROM UserSkill WHERE user_id = %s AND skill_name = %s", (user_id, skill_name))
        self.db.commit()
        affected = cursor.rowcount
        cursor.close()
        return affected

    def update(self, skill: UserSkill):
        cursor = self.db.cursor()
        query = """
            UPDATE UserSkill
            SET skill_name = %s, skill_level = %s
            WHERE skill_id = %s
        """
        cursor.execute(query, (skill.skill_name, skill.skill_level, skill.skill_id))
        self.db.commit()
        affected = cursor.rowcount
        cursor.close()
        return affected
