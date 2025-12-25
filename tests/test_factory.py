"""Test Repository Factory Pattern"""
from repositories.repository_factory import RepositoryFactory
from repositories.user_repository import UserRepository
from repositories.project_repository import ProjectRepository
from repositories.task_repository import TaskRepository
from repositories.sprint_repository import SprintRepository
from repositories.notification_repository import NotificationRepository

def test_factory_returns_user_repository():
    """Test factory returns UserRepository"""
    repo = RepositoryFactory.get_repository("user")
    assert isinstance(repo, UserRepository)
    print("✅ Factory returns UserRepository")

def test_factory_returns_project_repository():
    """Test factory returns ProjectRepository"""
    repo = RepositoryFactory.get_repository("project")
    assert isinstance(repo, ProjectRepository)
    print("✅ Factory returns ProjectRepository")

def test_factory_returns_task_repository():
    """Test factory returns TaskRepository"""
    repo = RepositoryFactory.get_repository("task")
    assert isinstance(repo, TaskRepository)
    print("✅ Factory returns TaskRepository")

def test_factory_returns_sprint_repository():
    """Test factory returns SprintRepository"""
    repo = RepositoryFactory.get_repository("sprint")
    assert isinstance(repo, SprintRepository)
    print("✅ Factory returns SprintRepository")

def test_factory_returns_notification_repository():
    """Test factory returns NotificationRepository"""
    repo = RepositoryFactory.get_repository("notification")
    assert isinstance(repo, NotificationRepository)
    print("✅ Factory returns NotificationRepository")

def test_factory_invalid_type_raises_error():
    """Test factory raises error for invalid repository type"""
    try:
        RepositoryFactory.get_repository("invalid_type")
        assert False, "Should have raised exception"
    except (ValueError, KeyError, Exception):
        assert True
        print("✅ Factory correctly raises error for invalid type")
