import datetime
class Sprint:
    def __init__(self, sprint_id, name, start_date, end_date, velocity):
        self.sprint_id: int = sprint_id
        self.name: str = name
        self.start_date: datetime.date = start_date
        self.end_date: datetime.date = end_date
        self.velocity: float = velocity
        self.tasks: list = []