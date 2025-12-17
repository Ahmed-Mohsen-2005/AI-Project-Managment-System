import datetime

class Project:
    # 1. Move project_id to the end and default to None
    def __init__(self, name, description, start_date, end_date, budget, project_id=None):
        self.project_id = project_id
        self.name: str = name
        self.description: str = description
        self.start_date: datetime.date = start_date
        self.end_date: datetime.date = end_date
        self.budget: float = budget
        self.sprints: list = []
        self.reports: list = []

    # 2. Add to_dict for JSON serialization
    def to_dict(self):
        return {
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "start_date": str(self.start_date) if self.start_date else None,
            "end_date": str(self.end_date) if self.end_date else None,
            "budget": float(self.budget) if self.budget else 0.0
        }