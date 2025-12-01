import datetime
from enum import Enum

class Status(Enum):
    TODO = 1
    IN_PROGRESS = 2
    DONE = 3

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

class Task:
    def __init__(self, task_id, title, status, priority, estimate_Hours, due_date, assigned_id, created_by, history):
        self.task_id: int = task_id
        self.title: str = title
        self.status: Status = status
        self.priority: Priority = priority
        self.estimate_Hours: int = estimate_Hours
        self.due_date: datetime.date = due_date
        self.assigned_id = assigned_id
        self.created_by = created_by 
        self.history: list = history
