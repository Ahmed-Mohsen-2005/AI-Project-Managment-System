from core.db_singleton import DatabaseConnection
from models.note import Note


class NoteRepository:
    """
    Repository responsible for all Note database operations.
    Fully safe against:
    - MySQL connection drops
    - Flask debug reloads
    - Cursor lifecycle errors
    """

    def _get_db(self):
        db = DatabaseConnection().get_connection()
        if not db:
            raise Exception("MySQL Connection not available")
        return db

    # ================================
    # Get all notes
    # ================================
    def get_all(self):
        cursor = None
        try:
            db = self._get_db()
            cursor = db.cursor(dictionary=True)

            query = "SELECT * FROM note"
            cursor.execute(query)
            rows = cursor.fetchall()

            return [Note(**row) for row in rows]

        except Exception as e:
            print(f"[NoteRepository][get_all] Error: {e}")
            return []

        finally:
            if cursor:
                cursor.close()

    # ================================
    # Get notes by entity (task/project/sprint)
    # ================================
    def get_by_entity(self, entity_type, entity_id):
        cursor = None
        try:
            db = self._get_db()
            cursor = db.cursor(dictionary=True)

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
            if cursor:
                cursor.close()

    # ================================
    # Create new note
    # ================================
    def create(self, note: Note):
        cursor = None
        try:
            db = self._get_db()
            cursor = db.cursor()

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
            db.commit()
            return cursor.lastrowid

        except Exception as e:
            if cursor:
                db.rollback()
            print(f"[NoteRepository][create] Error: {e}")
            return None

        finally:
            if cursor:
                cursor.close()

    # ================================
    # Delete note
    # ================================
    def delete(self, note_id):
        cursor = None
        try:
            db = self._get_db()
            cursor = db.cursor()

            query = "DELETE FROM note WHERE note_id = %s"
            cursor.execute(query, (note_id,))
            db.commit()

            return cursor.rowcount > 0

        except Exception as e:
            if cursor:
                db.rollback()
            print(f"[NoteRepository][delete] Error: {e}")
            return False

        finally:
            if cursor:
                cursor.close()

    # ================================
    # Update note content
    # ================================
    def update_content(self, note_id, new_content):
        cursor = None
        try:
            db = self._get_db()
            cursor = db.cursor()

            query = """
                UPDATE note
                SET content = %s
                WHERE note_id = %s
            """
            cursor.execute(query, (new_content, note_id))
            db.commit()

            return cursor.rowcount > 0

        except Exception as e:
            if cursor:
                db.rollback()
            print(f"[NoteRepository][update_content] Error: {e}")
            return False

        finally:
            if cursor:
                cursor.close()
