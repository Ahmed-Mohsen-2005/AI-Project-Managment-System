import datetime

class Sprint:
    # 1. Move sprint_id to the end and set default to None
    def __init__(self, project_id, name, start_date, end_date, velocity, sprint_id=None, status ='future'):
        self.sprint_id = sprint_id  # It will be None when creating a new sprint
        self.project_id = project_id
        self.name: str = name
        self.start_date: datetime.date = start_date
        self.end_date: datetime.date = end_date
        self.velocity: float = velocity
        self.status = status        

    def to_dict(self):
        return {
            "sprint_id": self.sprint_id,
            "project_id": self.project_id,
            "name": self.name,
            "start_date": str(self.start_date) if self.start_date else None,
            "end_date": str(self.end_date) if self.end_date else None,
            "velocity": float(self.velocity) if self.velocity else 0.0,
            "status": self.status
        }