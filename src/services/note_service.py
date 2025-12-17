from models import note
from repositories import note_repository


class NoteService:
    def __init__(self):
        self.note_repo = note_repository.NoteRepository()

    # ====================================
    # Get all notes
    # ====================================
    def get_all_notes(self):
        return self.note_repo.get_all()

    # ====================================
    # Get notes by entity (task / project / sprint)
    # ====================================
    def get_notes_by_entity(self, entity_type: str, entity_id: int):
        entity_type = entity_type.lower()

        if entity_type not in ["task", "project", "sprint"]:
            raise ValueError("Invalid entity_type. Must be task, project, or sprint")

        if not entity_id:
            raise ValueError("entity_id is required")

        return self.note_repo.get_by_entity(entity_type, entity_id)

    # ====================================
    # Create new note
    # ====================================
    def create_note(self, note_obj: note.Note):
        if not note_obj.content:
            raise ValueError("Note content is required")

        if not note_obj.entity_type or not note_obj.entity_id:
            raise ValueError("entity_type and entity_id are required")

        return self.note_repo.create(note_obj)

    # ====================================
    # Update note content
    # ====================================
    def update_note_content(self, note_id: int, new_content: str):
        if not new_content:
            raise ValueError("New content cannot be empty")

        updated = self.note_repo.update_content(note_id, new_content)
        if not updated:
            raise ValueError(f"Note with ID {note_id} does not exist")

        return updated

    # ====================================
    # Delete note
    # ====================================
    def delete_note(self, note_id: int):
        deleted = self.note_repo.delete(note_id)
        if not deleted:
            raise ValueError(f"Note with ID {note_id} does not exist")
        return deleted
