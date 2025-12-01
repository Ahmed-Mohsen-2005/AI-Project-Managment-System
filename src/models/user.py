class User:
    def __init__(self, user_id, name, email, password, role, prefs):
        self.user_id: int = user_id
        self.name: str = name
        self.email: str = email
        self.role: str = role
        self.prefs: dict = prefs
        self._password: str = password  
        
    def authenticate(self, password: str) -> bool:
        return self.password == password