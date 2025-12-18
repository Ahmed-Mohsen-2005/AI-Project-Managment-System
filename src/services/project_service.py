from models import project
from repositories import project_repository
from typing import Tuple, Optional

class ProjectService:
    def __init__(self):
        self.project_repos = project_repository

    