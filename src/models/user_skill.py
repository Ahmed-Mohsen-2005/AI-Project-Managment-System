class UserSkill:
    def __init__(self, skill_id=None, user_id=None, skill_name=None, skill_level=1):
        self.skill_id = skill_id
        self.user_id = user_id
        self.skill_name = skill_name
        self.skill_level = skill_level  # 1=Familiar, 2=Proficient, 3=Expert

    def to_dict(self):
        return {
            "skill_id": self.skill_id,
            "user_id": self.user_id,
            "name": self.skill_name,
            "level": self.skill_level
        }

    @staticmethod
    def get_level_text(level):
        if level == 3:
            return 'Expert'
        elif level == 2:
            return 'Proficient'
        return 'Familiar'
