from models.user import Userr
from repositories.user_repository import UserRepository
from typing import Tuple, Optional

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def register_user(self, name: str, email: str, password: str) -> Tuple[bool, Optional[Userr], str]:
        if self.user_repo.get_by_email(email):
            return False, None, "Email address already registered."

        new_user = Userr(user_id=None, name=name, email=email, password=password, role="standard")

        try:
            created_user = self.user_repo.create(new_user)
            return True, created_user, "Registration successful."
        except Exception as e:
            return False, None, f"Database error during registration: {str(e)}"

    def login_user(self, email: str, password: str) -> Tuple[bool, Optional[Userr], str]:
        user = self.user_repo.get_by_email(email)

        if not user:
            print("DEBUG: No user found with email:", email)
            return False, None, "Invalid email or password."
        
        if user.authenticate(password):
            print("DEBUG: User authenticated successfully:", email)
            return True, user, "Login successful."
        else:
            print("DEBUG: Password authentication failed for user:", email)
            return False, None, "Invalid email or password."