from core.db_singleton import DatabaseConnection
from models.note import Note


class NoteRepository:
    def __init__(self):
        # Store the manager instance
        self.db_manager = DatabaseConnection()

    # ================================
    # Get all notes
    # ================================
    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = "SELECT * FROM note"
            cursor.execute(query)
            rows = cursor.fetchall()
            return [Note(**row) for row in rows]
        except Exception as e:
            print(f"[NoteRepository][get_all] Error: {e}")
            return []
        finally:
            cursor.close()
            conn.close() # Return to pool

    # ================================
    # Get notes by entity (task/project/sprint)
    # ================================
    def get_by_entity(self, entity_type, entity_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
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
            conn.close()

    # ================================
    # Create new note
    # ================================
    def create(self, note: Note):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
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
            conn.commit() # Commit on the specific connection
            return cursor.lastrowid
        except Exception as e:
            conn.rollback()
            print(f"[NoteRepository][create] Error: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    # ================================
    # Delete note
    # ================================
    def delete(self, note_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = "DELETE FROM note WHERE note_id = %s"
            cursor.execute(query, (note_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"[NoteRepository][delete] Error: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    # ================================
    # Update note content
    # ================================
    def update_content(self, note_id, new_content):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor()
        try:
            query = """
                UPDATE note
                SET content = %s
                WHERE note_id = %s
            """
            cursor.execute(query, (new_content, note_id))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"[NoteRepository][update_content] Error: {e}")
            return False
        finally:
            cursor.close()
            conn.close()
