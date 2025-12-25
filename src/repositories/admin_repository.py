"""
Admin Repository - MySQL Implementation
"""
from datetime import datetime
from data.db_session import get_db

class AdminRepository:
    def __init__(self):
        pass
    
    # Helper to clean up resources
    def _execute_query(self, query, params=None, fetch=False, fetch_one=False):
        conn = None
        cursor = None
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(query, params or ())
            
            if fetch:
                return cursor.fetchall()
            if fetch_one:
                return cursor.fetchone()
            
            conn.commit()
            return True
        except Exception as e:
            # This print is crucial for debugging
            print(f"\n[DB ERROR] Query: {query}")
            print(f"[DB ERROR] Params: {params}")
            print(f"[DB ERROR] Exception: {str(e)}\n")
            if conn: conn.rollback()
            return None
        finally:
            if cursor: cursor.close()
            if conn: conn.close()

    # ============== USER MANAGEMENT ==============
    def get_all_users(self):
        # FIX: Select password_hash just in case you need it later, or omit it for security
        query = "SELECT user_id, name, email, `role`, `type` FROM userr ORDER BY name"
        rows = self._execute_query(query, fetch=True)
        if rows is None: return []
        
        return [{'user_id': r[0], 'name': r[1], 'email': r[2], 'role': r[3], 'type': r[4]} for r in rows]

    def get_user_by_id(self, user_id):
        query = "SELECT user_id, name, email, `role`, `type` FROM userr WHERE user_id = %s"
        row = self._execute_query(query, (user_id,), fetch_one=True)
        if row:
            return {'user_id': row[0], 'name': row[1], 'email': row[2], 'role': row[3], 'type': row[4]}
        return None

    def get_user_by_email(self, email):
        query = "SELECT user_id, name, email, `role`, `type` FROM userr WHERE email = %s"
        row = self._execute_query(query, (email,), fetch_one=True)
        if row:
            return {'user_id': row[0], 'name': row[1], 'email': row[2], 'role': row[3], 'type': row[4]}
        return None

    def create_user(self, name, email, password, role, user_type):
        # FIX: Changed column 'password' to 'password_hash'
        query = "INSERT INTO userr (name, email, password_hash, `role`, `type`) VALUES (%s, %s, %s, %s, %s)"
        return self._execute_query(query, (name, email, password, role, user_type))

    def update_user_details(self, user_id, name, email, role, user_type, hashed_password=None):
        """Update user details. If hashed_password is provided, update it too."""
        if hashed_password:
            # FIX: Changed column 'password' to 'password_hash'
            query = "UPDATE userr SET name=%s, email=%s, `role`=%s, `type`=%s, password_hash=%s WHERE user_id=%s"
            params = (name, email, role, user_type, hashed_password, user_id)
        else:
            query = "UPDATE userr SET name=%s, email=%s, `role`=%s, `type`=%s WHERE user_id=%s"
            params = (name, email, role, user_type, user_id)
            
        return self._execute_query(query, params)

    def delete_user(self, user_id):
        query = "UPDATE userr SET `role` = 'inactive' WHERE user_id = %s"
        return self._execute_query(query, (user_id,))

    # ============== AUDIT LOGGING ==============
    def log_admin_action(self, admin_id, action, description, target_user_id=None):
        query = """
        INSERT INTO admin_audit_log (admin_id, action, description, target_user_id, timestamp)
        VALUES (%s, %s, %s, %s, %s)
        """
        return self._execute_query(query, (admin_id, action, description, target_user_id, datetime.now()))

    def get_audit_logs(self, limit=100):
        query = """
        SELECT admin_id, action, description, target_user_id, timestamp
        FROM admin_audit_log
        ORDER BY timestamp DESC
        LIMIT %s
        """
        rows = self._execute_query(query, (limit,), fetch=True)
        if rows is None: return []
        
        return [{'admin_id': r[0], 'action': r[1], 'description': r[2], 'target_user_id': r[3], 'timestamp': r[4]} for r in rows]
    # ... existing methods ...

    # ============== SETTINGS MANAGEMENT ==============
    def get_settings(self):
        """Fetch all settings as a key-value dictionary"""
        query = "SELECT setting_key, setting_value FROM system_settings"
        rows = self._execute_query(query, fetch=True)
        if rows is None: return {}
        
        # Convert list of tuples [('k','v'),...] to dict {'k':'v',...}
        return {row[0]: row[1] for row in rows}

    def update_settings(self, settings_dict):
        """Update settings. Expects a dict."""
        conn = None
        cursor = None
        try:
            conn = get_db()
            cursor = conn.cursor()
            
            # Use ON DUPLICATE KEY UPDATE to handle both insert and update
            query = """
            INSERT INTO system_settings (setting_key, setting_value) 
            VALUES (%s, %s) 
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            """
            
            # Prepare batch data
            params = [(k, str(v)) for k, v in settings_dict.items()]
            
            cursor.executemany(query, params)
            conn.commit()
            return True
        except Exception as e:
            print(f"[DB ERROR] Settings Update: {str(e)}")
            if conn: conn.rollback()
            return False
        finally:
            if cursor: cursor.close()
            if conn: conn.close()