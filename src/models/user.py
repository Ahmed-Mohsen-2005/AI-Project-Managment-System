import bcrypt
class Userr:
    def __init__(self, user_id, name, email, password, type ,role = "Standard" ,is_hashed=False):
        self.user_id: int = user_id
        self.name: str = name
        self.email: str = email
        self.role: str = role
        self.type: str = type
        
        # Store password securely
        if is_hashed:
            # If loaded from DB, it's already hashed
            self._password_hash = password 
        else:
            # If created by service, hash it now
            self._password_hash = self._hash_password(password)

    def _hash_password(self, password: str) -> str:
        """Hashes the plain password using bcrypt."""
        # Note: bcrypt expects bytes
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        return hashed.decode('utf-8')

    def authenticate(self, password: str) -> bool:
        """Checks a plaintext password against the stored hash."""
        try:
            # Note: bcrypt expects bytes for comparison
            return bcrypt.checkpw(password.encode('utf-8'), self._password_hash.encode('utf-8'))
        except ValueError:
            # Handle cases where the stored hash might be malformed
            return False

    def to_dict(self, include_sensitive=False) -> dict:
        """Returns a dictionary representation for JSON serialization."""
        data = {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }
        if include_sensitive:
            data['password_hash'] = self._password_hash
        return data

    @property
    def password_hash(self):
        """Expose the password hash for the repository to save to DB."""
        return self._password_hash