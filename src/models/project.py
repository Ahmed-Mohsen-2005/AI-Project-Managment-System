import datetime
class Project:
    def __init__(self, project_id, name, description, start_date, end_date, budget):
        self.project_id: int = project_id
        self.name: str = name
        self.description: str = description
        self.start_date: datetime.date = start_date
        self.end_date: datetime.date = end_date
        self.budget: float = budget
        self.sprints: list = []
        self.reports: list = []

    def to_dict(self):
        return {
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "start_date": str(self.start_date) if self.start_date else None,
            "end_date": str(self.end_date) if self.end_date else None,
            "budget": float(self.budget) if self.budget else 0
        }