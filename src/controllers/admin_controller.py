"""
Admin Controller - Handles admin panel routes and user management APIs
"""
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from services.admin_service import AdminService

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
admin_service = AdminService()

# ============== AUTHENTICATION DECORATOR ==============
def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is logged in as admin
        if 'admin_user' not in session:
            return redirect(url_for('root'))  # Redirect to home/login
        return f(*args, **kwargs)
    return decorated_function

# ============== ADMIN PANEL PAGE ==============
@admin_bp.route('/panel')
@admin_required
def panel():
    """Admin panel main page"""
    return render_template('admin.html')

# ============== USER MANAGEMENT APIs ==============
@admin_bp.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    """Get all users"""
    try:
        users = admin_service.get_all_users()
        return jsonify({'success': True, 'users': users}), 200
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Get specific user"""
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
    """Create new user"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        role = data.get('role', 'user').strip()
        user_type = data.get('type', '').strip()
        
        if not name or not email:
            return jsonify({'success': False, 'message': 'Name and email are required'}), 400
        
        # Check if user already exists
        existing = admin_service.get_user_by_email(email)
        if existing:
            return jsonify({'success': False, 'message': 'User with this email already exists'}), 409
        
        # For now, we'll just update in the database (you may need to add create logic to service)
        # This is a placeholder - implement actual user creation as needed
        return jsonify({'success': False, 'message': 'User creation not yet implemented'}), 501
        
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user role and type"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        role = data.get('role')
        user_type = data.get('type')
        
        # Update role if provided
        if role:
            admin_service.update_user_role(user_id, role)
        
        # Update type if provided
        if user_type:
            admin_service.update_user_type(user_id, user_type)
        
        # Log action
        admin_service.log_admin_action(
            session.get('admin_user'),
            'user_modified',
            f'Modified user: {name or email}'
        )
        
        # Get updated user
        user = admin_service.get_user_by_id(user_id)
        return jsonify({'success': True, 'message': 'User updated successfully', 'user': user}), 200
        
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete user (soft delete)"""
    try:
        # Get user before deletion for logging
        user = admin_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Delete user (soft delete by marking as inactive)
        admin_service.delete_user(user_id)
        
        # Log action
        admin_service.log_admin_action(
            session.get('admin_user'),
            'user_deleted',
            f'Deleted user: {user.get("name", "Unknown")}'
        )
        
        return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        print(f"Error deleting user: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/audit-log', methods=['GET'])
@admin_required
def get_audit_log():
    """Get audit log"""
    try:
        limit = request.args.get('limit', 100, type=int)
        logs = admin_service.get_audit_logs(limit)
        return jsonify({'success': True, 'logs': logs}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
