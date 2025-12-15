from models import task
from repositories import task_repository

class TaskService:
    def __init__(self):
        self.task_repo = task_repository.TaskRepository()


    # Get all tasks
    def get_all_tasks(self):
        return self.task_repo.get_all()

    # Get task by ID
    def get_task_by_id(self, task_id: int):
        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise ValueError(f"Task with ID {task_id} not found")
        return task

    # Get tasks by sprint ID
    def get_tasks_by_sprint(self, sprint_id: int):
        """Get all tasks for a specific sprint/project"""
        return self.task_repo.get_by_sprint(sprint_id)

    # Add new task
    def create_task(self, task: task.Task):
        if not task.title or not task.sprint_id:
            raise ValueError("Task title and sprint_id are required")
        return self.task_repo.add_task(task)

    # Update task
    def update_task(self, task: task.Task):
        existing_task = self.task_repo.get_by_id(task.task_id)
        if not existing_task:
            raise ValueError(f"Task with ID {task.task_id} does not exist")
        return self.task_repo.update_task(task)

    # Delete task
    def delete_task(self, task_id: int):
        existing_task = self.task_repo.get_by_id(task_id)
        if not existing_task:
            raise ValueError(f"Task with ID {task_id} does not exist")
        return self.task_repo.delete_task(task_id)
    
    # Get recent tasks for a user
    def get_user_recent_tasks(self, user_id: int, limit: int = 5):
        return self.task_repo.get_user_recent_tasks(user_id, limit)

    def get_user_overdue_tasks(self, user_id: int):
        return self.task_repo.get_user_overdue_tasks(user_id)

    def get_tasks_by_status(self, status: str):
        return self.task_repo.get_tasks_by_status(status)