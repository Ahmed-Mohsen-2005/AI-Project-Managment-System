"""
Admin Controller - Handles admin panel routes and access control management
"""
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from functools import wraps
from datetime import datetime
import hashlib
from services.admin_service import AdminService
from data.db_session import get_db

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
admin_service = AdminService()

# ============== AUTHENTICATION DECORATOR ==============
def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is logged in as admin
        if 'admin_user' not in session:
            return redirect(url_for('root'))  # Redirect to login
        return f(*args, **kwargs)
    return decorated_function

# ============== ADMIN PANEL ==============
@admin_bp.route('/panel')
@admin_required
def panel():
    """Admin panel main page"""
    return render_template('admin.html')

# ============== ROLE MANAGEMENT APIs ==============
@admin_bp.route('/api/admin/roles', methods=['GET'])
@admin_required
def get_roles():
    """Get all roles"""
    try:
        roles = admin_service.get_all_roles()
        return jsonify({'success': True, 'roles': roles})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/roles/<int:role_id>', methods=['GET'])
@admin_required
def get_role(role_id):
    """Get specific role"""
    try:
        role = admin_service.get_role_by_id(role_id)
        if role:
            return jsonify({'success': True, **role})
        return jsonify({'success': False, 'message': 'Role not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/roles', methods=['POST'])
@admin_required
def create_role():
    """Create new role"""
    try:
        data = request.get_json()
        role_name = data.get('role_name', '').strip()
        description = data.get('description', '').strip()
        
        if not role_name:
            return jsonify({'success': False, 'message': 'Role name is required'}), 400
        
        role = admin_service.create_role(role_name, description)
        
        # Log action
        admin_service.log_admin_action(
            session.get('admin_user'),
            'role_created',
            f'Created role: {role_name}'
        )
        
        return jsonify({'success': True, 'role': role})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/roles/<int:role_id>', methods=['PUT'])
@admin_required
def update_role(role_id):
    """Update role"""
    try:
        data = request.get_json()
        role_name = data.get('role_name', '').strip()
        description = data.get('description', '').strip()
        
        if not role_name:
            return jsonify({'success': False, 'message': 'Role name is required'}), 400
        
        role = admin_service.update_role(role_id, role_name, description)
        
        if role:
            # Log action
            admin_service.log_admin_action(
                session.get('admin_user'),
                'role_modified',
                f'Modified role: {role_name}'
            )
            return jsonify({'success': True, 'role': role})
        return jsonify({'success': False, 'message': 'Role not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/roles/<int:role_id>', methods=['DELETE'])
@admin_required
def delete_role(role_id):
    """Delete role"""
    try:
        role_name = admin_service.get_role_name_by_id(role_id)
        success = admin_service.delete_role(role_id)
        
        if success:
            # Log action
            admin_service.log_admin_action(
                session.get('admin_user'),
                'role_deleted',
                f'Deleted role: {role_name}'
            )
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Role not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============== PERMISSION MANAGEMENT APIs ==============
@admin_bp.route('/api/admin/permissions', methods=['GET'])
@admin_required
def get_permissions():
    """Get all permissions"""
    try:
        permissions = admin_service.get_all_permissions()
        return jsonify({'success': True, 'permissions': permissions})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/permissions/<int:permission_id>', methods=['GET'])
@admin_required
def get_permission(permission_id):
    """Get specific permission"""
    try:
        permission = admin_service.get_permission_by_id(permission_id)
        if permission:
            return jsonify({'success': True, **permission})
        return jsonify({'success': False, 'message': 'Permission not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/permissions', methods=['POST'])
@admin_required
def create_permission():
    """Create new permission"""
    try:
        data = request.get_json()
        permission_name = data.get('permission_name', '').strip()
        description = data.get('description', '').strip()
        
        if not permission_name:
            return jsonify({'success': False, 'message': 'Permission name is required'}), 400
        
        permission = admin_service.create_permission(permission_name, description)
        
        # Log action
        admin_service.log_admin_action(
            session.get('admin_user'),
            'permission_created',
            f'Created permission: {permission_name}'
        )
        
        return jsonify({'success': True, 'permission': permission})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/permissions/<int:permission_id>', methods=['PUT'])
@admin_required
def update_permission(permission_id):
    """Update permission"""
    try:
        data = request.get_json()
        permission_name = data.get('permission_name', '').strip()
        description = data.get('description', '').strip()
        
        if not permission_name:
            return jsonify({'success': False, 'message': 'Permission name is required'}), 400
        
        permission = admin_service.update_permission(permission_id, permission_name, description)
        
        if permission:
            # Log action
            admin_service.log_admin_action(
                session.get('admin_user'),
                'permission_modified',
                f'Modified permission: {permission_name}'
            )
            return jsonify({'success': True, 'permission': permission})
        return jsonify({'success': False, 'message': 'Permission not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/permissions/<int:permission_id>', methods=['DELETE'])
@admin_required
def delete_permission(permission_id):
    """Delete permission"""
    try:
        permission_name = admin_service.get_permission_name_by_id(permission_id)
        success = admin_service.delete_permission(permission_id)
        
        if success:
            # Log action
            admin_service.log_admin_action(
                session.get('admin_user'),
                'permission_deleted',
                f'Deleted permission: {permission_name}'
            )
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Permission not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============== ACCESS CONTROL APIs ==============
@admin_bp.route('/api/admin/access-control', methods=['GET'])
@admin_required
def get_access_control():
    """Get access control matrix"""
    try:
        roles = admin_service.get_access_control_matrix()
        resources = ['sprint_boards', 'reports', 'user_profiles', 'budget_data', 'integrations']
        return jsonify({'success': True, 'roles': roles, 'resources': resources})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/access-control/<int:role_id>', methods=['PUT'])
@admin_required
def update_access_control(role_id):
    """Update access control for a role"""
    try:
        data = request.get_json()
        resource = data.get('resource', '').strip()
        access = data.get('access', False)
        
        if not resource:
            return jsonify({'success': False, 'message': 'Resource is required'}), 400
        
        admin_service.update_access_control(role_id, resource, access)
        
        # Log action
        admin_service.log_admin_action(
            session.get('admin_user'),
            'access_control_modified',
            f'Updated access control for resource: {resource}'
        )
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============== USER ROLE MANAGEMENT APIs ==============
@admin_bp.route('/api/admin/user-roles', methods=['GET'])
@admin_required
def get_user_roles():
    """Get all users with their roles"""
    try:
        users = admin_service.get_all_users_with_roles()
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/api/admin/user-roles/<int:user_id>', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    """Update user role"""
    try:
        data = request.get_json()
        role_id = data.get('role_id')
        
        if not role_id:
            return jsonify({'success': False, 'message': 'Role ID is required'}), 400
        
        success = admin_service.assign_user_role(user_id, role_id)
        
        if success:
            # Log action
            admin_service.log_admin_action(
                session.get('admin_user'),
                'user_role_changed',
                f'Changed role for user ID: {user_id}'
            )
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Error updating user role'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============== AUDIT LOG APIs ==============
@admin_bp.route('/api/admin/audit-log', methods=['GET'])
@admin_required
def get_audit_log():
    """Get admin audit log"""
    try:
        logs = admin_service.get_audit_log()
        return jsonify({'success': True, 'logs': logs})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
