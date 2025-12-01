import datetime

class Ai_Engine:
    def __init__(self, engine_id, modelVersion, channel, lastTrained):
        self.engine_id: int = engine_id
        self.modelVersion: str = modelVersion
        self.lastTrained: datetime.date = lastTrained
