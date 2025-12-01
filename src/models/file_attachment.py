import datetime
class FileAttachment:
    def __init__(self, file_id, filename, file_type, file_size,file_url, uploaded_by, uploaded_at):
        self.file_id: int = file_id
        self.filename: str = filename
        self.file_type: str = file_type
        self.file_size: int = file_size  
        self.file_url: str = file_url
        self.uploaded_by: str = uploaded_by
        self.uploaded_at: datetime.date = uploaded_at  