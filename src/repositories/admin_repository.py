"""
Admin Repository - Database access layer for admin operations
Works with existing userr table and optional admin_audit_log table
"""
from datetime import datetime
from data.db_session import get_db

class AdminRepository:
    def __init__(self):
        self.db = get_db()
    
    # ============== USER MANAGEMENT ==============
    def get_all_users(self):
        """Get all users from userr table"""
        try:
            query = "SELECT user_id, name, email, role, type FROM userr ORDER BY name"
            result = self.db.execute(query)
            users = []
            for row in result:
                users.append({
                    'user_id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'role': row[3],
                    'type': row[4]
                })
            return users
        except Exception as e:
            print(f"Error fetching users: {str(e)}")
            return []
    
    def get_user_by_id(self, user_id):
        """Get specific user by ID"""
        try:
            query = "SELECT user_id, name, email, role, type FROM userr WHERE user_id = ?"
            result = self.db.execute(query, (user_id,))
            row = result.fetchone()
            if row:
                return {
                    'user_id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'role': row[3],
                    'type': row[4]
                }
            return None
        except Exception as e:
            print(f"Error fetching user {user_id}: {str(e)}")
            return None
    
    def get_user_by_email(self, email):
        """Get user by email"""
        try:
            query = "SELECT user_id, name, email, role, type FROM userr WHERE email = ?"
            result = self.db.execute(query, (email,))
            row = result.fetchone()
            if row:
                return {
                    'user_id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'role': row[3],
                    'type': row[4]
                }
            return None
        except Exception as e:
            print(f"Error fetching user by email: {str(e)}")
            return None
    
    def get_users_by_role(self, role):
        """Get all users with specific role"""
        try:
            query = "SELECT user_id, name, email, role, type FROM userr WHERE role = ? ORDER BY name"
            result = self.db.execute(query, (role,))
            users = []
            for row in result:
                users.append({
                    'user_id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'role': row[3],
                    'type': row[4]
                })
            return users
        except Exception as e:
            print(f"Error fetching users by role {role}: {str(e)}")
            return []
    
    def update_user_role(self, user_id, role):
        """Update user's role"""
        try:
            query = "UPDATE userr SET role = ? WHERE user_id = ?"
            self.db.execute(query, (role, user_id))
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error updating user role: {str(e)}")
            self.db.rollback()
            return False
    
    def update_user_type(self, user_id, user_type):
        """Update user's type"""
        try:
            query = "UPDATE userr SET type = ? WHERE user_id = ?"
            self.db.execute(query, (user_type, user_id))
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error updating user type: {str(e)}")
            self.db.rollback()
            return False
    
    def delete_user(self, user_id):
        """Delete user (soft delete - marks as inactive)"""
        try:
            query = "UPDATE userr SET role = 'inactive' WHERE user_id = ?"
            self.db.execute(query, (user_id,))
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error deleting user: {str(e)}")
            self.db.rollback()
            return False
    
    # ============== AUDIT LOGGING ==============
    def log_admin_action(self, admin_id, action, description, target_user_id=None):
        """Log admin action for audit trail"""
        try:
            query = """
            INSERT INTO admin_audit_log (admin_id, action, description, target_user_id, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """
            self.db.execute(query, (admin_id, action, description, target_user_id, datetime.now()))
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error logging admin action: {str(e)}")
            return False
    
    def get_audit_logs(self, limit=100):
        """Get recent audit logs"""
        try:
            query = """
            SELECT admin_id, action, description, target_user_id, timestamp
            FROM admin_audit_log
            ORDER BY timestamp DESC
            OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
            """
            result = self.db.execute(query, (limit,))
            logs = []
            for row in result:
                logs.append({
                    'admin_id': row[0],
                    'action': row[1],
                    'description': row[2],
                    'target_user_id': row[3],
                    'timestamp': row[4]
                })
            return logs
        except Exception as e:
            print(f"Error fetching audit logs: {str(e)}")
            return []
    
    def get_audit_logs_by_admin(self, admin_id, limit=50):
        """Get audit logs for specific admin"""
        try:
            query = """
            SELECT admin_id, action, description, target_user_id, timestamp
            FROM admin_audit_log
            WHERE admin_id = ?
            ORDER BY timestamp DESC
            OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
            """
            result = self.db.execute(query, (admin_id, limit))
            logs = []
            for row in result:
                logs.append({
                    'admin_id': row[0],
                    'action': row[1],
                    'description': row[2],
                    'target_user_id': row[3],
                    'timestamp': row[4]
                })
            return logs
        except Exception as e:
            print(f"Error fetching admin logs: {str(e)}")
            return []
