import datetime
from enum import Enum
class IntegrationType(Enum):
    API = "API"
    DATABASE = "DATABASE"
    FILE = "FILE"
class Integration:
    def __init__(self, integration_id, type, authtoken, last_synced):
        self.integration_id: int = integration_id
        self.type: IntegrationType = type
        self.authtoken: str = authtoken
        self.last_synced: datetime.date = last_synced
        