"""
Admin Service - Business logic for admin panel operations
Manages users and admin operations using existing database tables
"""
from datetime import datetime
from repositories.admin_repository import AdminRepository

class AdminService:
    def __init__(self):
        self.repo = AdminRepository()
    
    # ============== USER MANAGEMENT ==============
    def get_all_users(self):
        """Get all users from userr table"""
        return self.repo.get_all_users()
    
    def get_user_by_id(self, user_id):
        """Get specific user"""
        return self.repo.get_user_by_id(user_id)
    
    def get_user_by_email(self, email):
        """Get user by email"""
        return self.repo.get_user_by_email(email)
    
    def update_user_role(self, user_id, role):
        """Update user's role (admin, manager, user, guest)"""
        return self.repo.update_user_role(user_id, role)
    
    def update_user_type(self, user_id, user_type):
        """Update user's type"""
        return self.repo.update_user_type(user_id, user_type)
    
    def delete_user(self, user_id):
        """Delete user"""
        return self.repo.delete_user(user_id)
    
    def get_users_by_role(self, role):
        """Get all users with specific role"""
        return self.repo.get_users_by_role(role)
    
    # ============== AUDIT LOGGING ==============
    def log_admin_action(self, admin_id, action, description, target_user_id=None):
        """Log admin action for audit trail"""
        return self.repo.log_admin_action(admin_id, action, description, target_user_id)
    
    def get_audit_logs(self, limit=100):
        """Get recent audit logs"""
        return self.repo.get_audit_logs(limit)
    
    def get_audit_logs_by_admin(self, admin_id, limit=50):
        """Get audit logs for specific admin"""
        return self.repo.get_audit_logs_by_admin(admin_id, limit)
    

    def assign_user_role(self, user_id, role_id):
        """Assign role to user"""
        return self.repo.assign_user_role(user_id, role_id)
    
    def get_user_role(self, user_id):
        """Get user's assigned role"""
        return self.repo.get_user_role(user_id)
    
    # ============== AUDIT LOG ==============
    def log_admin_action(self, admin_name, action, details):
        """Log admin action to audit log"""
        return self.repo.log_admin_action(admin_name, action, details)
    
    def get_audit_log(self, limit=50):
        """Get admin audit log"""
        return self.repo.get_audit_log(limit)
    
    def get_audit_log_filtered(self, date_from=None, date_to=None, action=None):
        """Get filtered audit log"""
        return self.repo.get_audit_log_filtered(date_from, date_to, action)
