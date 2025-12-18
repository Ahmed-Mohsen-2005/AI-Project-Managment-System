from datetime import datetime

class UserActivity:
    def __init__(self, activity_id=None, user_id=None, action=None, timestamp=None):
        self.activity_id = activity_id
        self.user_id = user_id
        self.action = action
        self.timestamp = timestamp or datetime.now()

    def to_dict(self):
        return {
            "activity_id": self.activity_id,
            "user_id": self.user_id,
            "action": self.action,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else str(self.timestamp)
        }
