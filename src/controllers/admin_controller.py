"""
Admin Controller - Handles admin panel routes and user management APIs
"""
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from werkzeug.security import generate_password_hash
from services.admin_service import AdminService

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
admin_service = AdminService()

# ============== AUTHENTICATION DECORATOR ==============
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_user' not in session:
            return redirect(url_for('root'))
        return f(*args, **kwargs)
    return decorated_function

# ============== ADMIN PANEL PAGE ==============
@admin_bp.route('/panel')
@admin_required
def panel():
    return render_template('admin.html')

# ============== USER MANAGEMENT APIs ==============
@admin_bp.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    try:
        users = admin_service.get_all_users()
        return jsonify({'success': True, 'users': users}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    try:
        user = admin_service.get_user_by_id(user_id)
        if user:
            return jsonify({'success': True, 'user': user}), 200
        return jsonify({'success': False, 'message': 'User not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/users', methods=['POST'])
@admin_required
def create_user():
    """Create new user with password"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'user').strip()
        user_type = data.get('type', '').strip()
        
        if not name or not email or not password:
            return jsonify({'success': False, 'message': 'Name, Email and Password are required'}), 400
        
        # Check existing
        existing = admin_service.get_user_by_email(email)
        if existing:
            return jsonify({'success': False, 'message': 'User with this email already exists'}), 409
        
        # Hash password
        hashed_password = generate_password_hash(password)

        # Create
        # Ensure AdminService has this method forwarding to Repo
        success = admin_service.create_user(name, email, hashed_password, role, user_type)
        
        if success:
            admin_service.log_admin_action(session.get('admin_user'), 'user_created', f'Created user: {name}')
            return jsonify({'success': True, 'message': 'User created successfully'}), 201
        else:
            return jsonify({'success': False, 'message': 'Database error while creating user'}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user details including password if provided"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        role = data.get('role')
        user_type = data.get('type')
        password = data.get('password') # Optional
        
        hashed_password = None
        if password and password.strip():
            hashed_password = generate_password_hash(password.strip())
            
        # Call full update service
        # Ensure AdminService has update_user_details method
        success = admin_service.update_user_details(user_id, name, email, role, user_type, hashed_password)
        
        if success:
            admin_service.log_admin_action(session.get('admin_user'), 'user_modified', f'Modified user: {name}')
            user = admin_service.get_user_by_id(user_id)
            return jsonify({'success': True, 'message': 'User updated successfully', 'user': user}), 200
        else:
            return jsonify({'success': False, 'message': 'Failed to update user'}), 500
        
    except Exception as e:
        print(f"Update error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    try:
        user = admin_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        admin_service.delete_user(user_id)
        admin_service.log_admin_action(session.get('admin_user'), 'user_deleted', f'Deleted user: {user.get("name")}')
        return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/audit-log', methods=['GET'])
@admin_required
def get_audit_log():
    try:
        limit = request.args.get('limit', 100, type=int)
        logs = admin_service.get_audit_logs(limit)
        return jsonify({'success': True, 'logs': logs}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
# ... existing imports ...

# ============== SETTINGS APIs ==============
@admin_bp.route('/api/settings', methods=['GET'])
@admin_required
def get_settings():
    """Get system settings"""
    try:
        settings = admin_service.get_settings()
        return jsonify({'success': True, 'settings': settings}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/settings', methods=['POST'])
@admin_required
def update_settings():
    """Update system settings"""
    try:
        data = request.get_json()
        
        # Expecting a dict like: {'system_name': 'My App', 'maintenance_mode': 'true'}
        success = admin_service.update_settings(data)
        
        if success:
            admin_service.log_admin_action(
                session.get('admin_user'),
                'settings_updated',
                'Updated system configuration'
            )
            return jsonify({'success': True, 'message': 'Settings saved successfully'}), 200
        return jsonify({'success': False, 'message': 'Failed to save settings'}), 500
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500