import datetime
class Project:
    def __init__(self, project_id, name, description, start_date, end_date, budget):
        self.project_id: int = project_id
        self.name: str = name
        self.description: datetime.date = description
        self.start_date: datetime.date = start_date
        self.end_date: str = end_date
        self.budget: float = budget
        self.sprints: list = []
        self.reports: list = []