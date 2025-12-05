from models.file_attachment import FileAttachment
from core.db_singleton import DatabaseConnection

class FileAttachmentRepository:
    def __init__(self):
        self.db = DatabaseConnection().get_connection()

    def get_all(self):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT file_id, task_id, filename, file_url, file_type, file_size, uploaded_at,uploaded_by FROM FileAttachment")
        rows = cursor.fetchall()
        return [FileAttachment(**row) for row in rows]
    def get_by_id(self, id):
        cursor = self.db.cursor(dictionary=True)
        cursor.execute("SELECT file_id, task_id, filename,file_url, file_type,file_size, uploaded_at,uploaded_by FROM FileAttachment WHERE attachment_id=%s", (id,))
        row = cursor.fetchone()
        return FileAttachment(**row) if row else None