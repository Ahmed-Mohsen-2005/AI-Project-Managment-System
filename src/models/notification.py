import datetime
class notification:
    def __init__(self, notification_id, message, channel, sent_at):
        self.notification_id: int = notification_id
        self.message: str = message
        self.channel: str = channel
        self.sent_at: datetime.date = sent_at

