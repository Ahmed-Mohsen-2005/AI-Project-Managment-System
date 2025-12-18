from enum import Enum
from datetime import date, datetime

class Status(Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    IN_REVIEW = "IN_REVIEW"
    DONE = "DONE"

class Priority(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Task:
    def __init__(self, task_id=None, sprint_id=None, title=None, 
                 status="TODO", priority="MEDIUM", estimate_hours=None, 
                 due_date=None, created_by=None, assigned_id=None):
        self.task_id = task_id
        self.sprint_id = sprint_id
        self.title = title
        
        # Handle status enum conversion
        if isinstance(status, str):
            self.status = Status[status] if status in Status.__members__ else Status.TODO
        elif isinstance(status, Status):
            self.status = status
        else:
            self.status = Status.TODO
        
        # Handle priority enum conversion
        if isinstance(priority, str):
            self.priority = Priority[priority] if priority in Priority.__members__ else Priority.MEDIUM
        elif isinstance(priority, Priority):
            self.priority = priority
        else:
            self.priority = Priority.MEDIUM
        
        self.estimate_hours = estimate_hours
        
        # Handle due_date conversion - convert string to date object
        if isinstance(due_date, str):
            try:
                self.due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                self.due_date = None
        elif isinstance(due_date, date):
            self.due_date = due_date
        else:
            self.due_date = due_date  # None or already correct type
        
        self.created_by = created_by
        self.assigned_id = assigned_id

    def to_dict(self):
        """Convert Task object to dictionary for JSON serialization"""
        return {
            "task_id": self.task_id,
            "sprint_id": self.sprint_id,
            "title": self.title,
            "status": self.status.value if isinstance(self.status, Status) else self.status,
            "priority": self.priority.value if isinstance(self.priority, Priority) else self.priority,
            "estimate_hours": self.estimate_hours,
            "due_date": self.due_date.isoformat() if isinstance(self.due_date, date) else self.due_date,
            "created_by": self.created_by,
            "assigned_id": self.assigned_id
        }

    def __repr__(self):
        return f"<Task(id={self.task_id}, title='{self.title}', status={self.status}, priority={self.priority})>"