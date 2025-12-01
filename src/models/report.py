import datetime
class Report:
    def __init__(self, report_id, title, content, author, created_at):
        self.report_id: int = report_id
        self.title: str = title
        self.content: str = content
        self.author: str = author
        self.created_at: datetime.date = created_at
        self.updated_at: datetime.date = created_at
