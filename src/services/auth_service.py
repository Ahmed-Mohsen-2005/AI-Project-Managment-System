from models.user import Userr
from repositories.user_repository import UserRepository
from typing import Tuple, Optional

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def register_user(self, name: str, email: str, password: str) -> Tuple[bool, Optional[Userr], str]:
        if self.user_repo.get_by_email(email):
            return False, None, "Email address already registered."

        new_user = Userr(user_id=None, name=name, email=email, password=password, role="standard", type="standard")  # user_id will be set by DB

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
    def request_password_reset(self, email):
        """Checks if user exists and prepares reset logic."""
        user = self.user_repo.get_by_email(email)
        if not user:
            return False, "User with this email does not exist."
        
        # Here you would generate a token and save it to the DB
        # For this UI-focused task, we'll just confirm the user exists
        return True, "Reset link prepared."

    def reset_password(self, email, new_password):
        """Actual password update logic."""
        hashed_pw = Userr._hash_password(new_password)
        success = self.user_repo.update_password(email, hashed_pw)
        return success