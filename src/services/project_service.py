from src.models import project
from src.repositories import project_repository
from typing import Tuple, Optional

class ProjectService:
    def __init__(self):
        self.project_repos = project_repository

    