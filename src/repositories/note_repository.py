from core.db_singleton import DatabaseConnection
from models.note import Note

class NoteRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()

    # ================================
    # Get all notes
    # ================================
    def get_all(self):
        try:
            cursor = self.db.cursor(dictionary=True)
            query = "SELECT * FROM note"
            cursor.execute(query)
            rows = cursor.fetchall()

            notes = [Note(**row) for row in rows]
            return notes

        except Exception as e:
            print(f"[NoteRepository][get_all] Error: {e}")
            return []

        finally:
            cursor.close()

    # ================================
    # Get notes by entity (task/project/sprint)
    # ================================
    def get_by_entity(self, entity_type, entity_id):
        try:
            cursor = self.db.cursor(dictionary=True)
            query = """
                SELECT * FROM note
                WHERE entity_type = %s AND entity_id = %s
                ORDER BY created_at DESC
            """
            cursor.execute(query, (entity_type, entity_id))
            rows = cursor.fetchall()

            return [Note(**row) for row in rows]

        except Exception as e:
            print(f"[NoteRepository][get_by_entity] Error: {e}")
            return []

        finally:
            cursor.close()

    # ================================
    # Create new note
    # ================================
    def create(self, note: Note):
        try:
            cursor = self.db.cursor()
            query = """
                INSERT INTO note (content, entity_type, entity_id, created_by)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(
                query,
                (
                    note.content,
                    note.entity_type.value,
                    note.entity_id,
                    note.created_by
                )
            )
            self.db.commit()
            return cursor.lastrowid

        except Exception as e:
            self.db.rollback()
            print(f"[NoteRepository][create] Error: {e}")
            return None

        finally:
            cursor.close()

    # ================================
    # Delete note
    # ================================
    def delete(self, note_id):
        try:
            cursor = self.db.cursor()
            query = "DELETE FROM note WHERE note_id = %s"
            cursor.execute(query, (note_id,))
            self.db.commit()
            return cursor.rowcount > 0

        except Exception as e:
            self.db.rollback()
            print(f"[NoteRepository][delete] Error: {e}")
            return False

        finally:
            cursor.close()

    # ================================
    # Update note content
    # ================================
    def update_content(self, note_id, new_content):
        try:
            cursor = self.db.cursor()
            query = """
                UPDATE note
                SET content = %s
                WHERE note_id = %s
            """
            cursor.execute(query, (new_content, note_id))
            self.db.commit()
            return cursor.rowcount > 0

        except Exception as e:
            self.db.rollback()
            print(f"[NoteRepository][update_content] Error: {e}")
            return False

        finally:
            cursor.close()
