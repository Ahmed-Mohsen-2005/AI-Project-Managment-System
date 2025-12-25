"""
Admin Service - Business logic for admin operations
"""
from repositories.admin_repository import AdminRepository

class AdminService:
    def __init__(self):
        self.repo = AdminRepository()

    def get_all_users(self):
        return self.repo.get_all_users()

    def get_user_by_id(self, user_id):
        return self.repo.get_user_by_id(user_id)

    def get_user_by_email(self, email):
        return self.repo.get_user_by_email(email)

    def create_user(self, name, email, password, role, user_type):
        return self.repo.create_user(name, email, password, role, user_type)

    def update_user_details(self, user_id, name, email, role, user_type, hashed_password=None):
        return self.repo.update_user_details(user_id, name, email, role, user_type, hashed_password)

    def delete_user(self, user_id):
        return self.repo.delete_user(user_id)

    def log_admin_action(self, admin_id, action, description, target_user_id=None):
        return self.repo.log_admin_action(admin_id, action, description, target_user_id)

    def get_audit_logs(self, limit=100):
        return self.repo.get_audit_logs(limit)
    # ... existing methods ...

    def get_settings(self):
        """Get all system settings as a dictionary"""
        return self.repo.get_settings()

    def update_settings(self, settings_dict):
        """Update multiple settings"""
        return self.repo.update_settings(settings_dict)