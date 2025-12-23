from repositories.user_repository import UserRepository
from repositories.file_attachment_repository import FileAttachmentRepository
from repositories.integration_repository import IntegrationRepository
from repositories.notification_repository import NotificationRepository
from repositories.project_repository import ProjectRepository
from repositories.report_repository import ReportRepository
from repositories.sprint_repository import SprintRepository
from repositories.task_repository import TaskRepository
from repositories.user_skill_repository import UserSkillRepository
from repositories.user_activity_repository import UserActivityRepository


class RepositoryFactory:
    @staticmethod
    def get_repository(entity_type: str):
        entity_type = entity_type.lower()

        if entity_type == "user":
            return UserRepository()
        elif entity_type == "file_attachment":
            return FileAttachmentRepository()
        elif entity_type == "integration":
            return IntegrationRepository()
        elif entity_type == "notification":
            return NotificationRepository()
        elif entity_type == "project":
            return ProjectRepository()
        elif entity_type == "report":
            return ReportRepository()
        elif entity_type == "sprint":
            return SprintRepository()
        elif entity_type == "task":
            return TaskRepository()
        elif entity_type == "user_skill":
            return UserSkillRepository()
        elif entity_type == "user_activity":
            return UserActivityRepository()
        else:
            raise ValueError(f"Unknown repository type: {entity_type}")
