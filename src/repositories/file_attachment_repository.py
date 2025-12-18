from models.file_attachment import FileAttachment
from core.db_singleton import DatabaseConnection

class FileAttachmentRepository:
    def __init__(self):
        # Use the manager to facilitate connection pooling
        self.db_manager = DatabaseConnection()

    def get_all(self):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            query = """
                SELECT file_id, task_id, filename, file_url, file_type, 
                       file_size, uploaded_at, uploaded_by 
                FROM FileAttachment
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            return [FileAttachment(**row) for row in rows]
        finally:
            # Release resources back to the pool
            cursor.close()
            conn.close()

    def get_by_id(self, file_id):
        conn = self.db_manager.get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # Standardized the WHERE clause to match file_id
            query = """
                SELECT file_id, task_id, filename, file_url, file_type, 
                       file_size, uploaded_at, uploaded_by 
                FROM FileAttachment 
                WHERE file_id = %s
            """
            cursor.execute(query, (file_id,))
            row = cursor.fetchone()
            return FileAttachment(**row) if row else None
        finally:
            cursor.close()
            conn.close()