from models import task
from repositories import task_repository

class TaskService:
    def __init__(self):
        self.task_repo = task_repository.TaskRepository()

    # -------------------------------
    # BASIC OPERATIONS
    # -------------------------------
    def get_all_tasks(self):
        return self.task_repo.get_all()

    def get_task_by_id(self, task_id: int):
        task_obj = self.task_repo.get_by_id(task_id)
        if not task_obj:
            raise ValueError(f"Task with ID {task_id} not found")
        return task_obj

    def create_task(self, task: task.Task):
        if not task.title:
            raise ValueError("Task title is required")
        return self.task_repo.add_task(task)

    def update_task(self, task: task.Task):
        if not self.task_repo.get_by_id(task.task_id):
            raise ValueError(f"Task with ID {task.task_id} does not exist")
        return self.task_repo.update_task(task)

    def delete_task(self, task_id: int):
        if not self.task_repo.get_by_id(task_id):
            raise ValueError(f"Task with ID {task_id} does not exist")
        return self.task_repo.delete_task(task_id)

    # -------------------------------
    # SPRINT & BACKLOG
    # -------------------------------
    def get_tasks_by_sprint(self, sprint_id: int):
        return self.task_repo.get_by_sprint_id(sprint_id)

    def get_backlog_tasks(self):
        return self.task_repo.get_backlog_tasks()

    def create_backlog_task(self, task: task.Task):
        task.sprint_id = None
        return self.task_repo.add_task(task)

    # -------------------------------
    # DASHBOARD HELPERS
    # -------------------------------
    def get_user_recent_tasks(self, user_id: int, limit: int = 5):
        return self.task_repo.get_user_recent_tasks(user_id, limit)

    def get_user_overdue_tasks(self, user_id: int):
        return self.task_repo.get_user_overdue_tasks(user_id)

    def get_upcoming_tasks(self, user_id: int = None, limit: int = 5):
        return self.task_repo.get_backlog_tasks(
            user_id=user_id,
            limit=limit
        )
