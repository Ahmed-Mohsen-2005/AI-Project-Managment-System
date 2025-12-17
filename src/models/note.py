from enum import Enum
from datetime import datetime


class EntityType(Enum):
    TASK = "task"
    PROJECT = "project"
    SPRINT = "sprint"


class Note:
    def __init__(self, note_id=None, content=None,
                 entity_type="task", entity_id=None,
                 created_by=None, created_at=None):

        self.note_id = note_id
        self.content = content

        # Handle entity_type enum conversion
        if isinstance(entity_type, str):
            entity_type_upper = entity_type.upper()
            if entity_type_upper in EntityType.__members__:
                self.entity_type = EntityType[entity_type_upper]
            else:
                self.entity_type = EntityType.TASK
        elif isinstance(entity_type, EntityType):
            self.entity_type = entity_type
        else:
            self.entity_type = EntityType.TASK

        self.entity_id = entity_id
        self.created_by = created_by

        # Handle created_at conversion
        if isinstance(created_at, str):
            try:
                self.created_at = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError):
                self.created_at = None
        elif isinstance(created_at, datetime):
            self.created_at = created_at
        else:
            self.created_at = created_at  # None or already correct type

    def to_dict(self):
        """Convert Note object to dictionary for JSON serialization"""
        return {
            "note_id": self.note_id,
            "content": self.content,
            "entity_type": self.entity_type.value if isinstance(self.entity_type, EntityType) else self.entity_type,
            "entity_id": self.entity_id,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }

    def __repr__(self):
        return (
            f"<Note(id={self.note_id}, "
            f"entity_type={self.entity_type}, "
            f"entity_id={self.entity_id})>"
        )
