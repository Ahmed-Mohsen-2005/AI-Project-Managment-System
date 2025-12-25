from models.file_attachment import FileAttachment
from core.db_singleton import DatabaseConnection

class FileAttachmentRepository:
    def __init__(self):
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'file_attachment'
            cursor.execute("SELECT * FROM file_attachment")
            rows = cursor.fetchall()
            return [FileAttachment(**row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_by_id(self, file_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # FIX: Lowercase 'file_attachment'
            cursor.execute("SELECT * FROM file_attachment WHERE file_id = %s", (file_id,))
            row = cursor.fetchone()
            return FileAttachment(**row) if row else None
        finally:
            cursor.close()
            conn.close()