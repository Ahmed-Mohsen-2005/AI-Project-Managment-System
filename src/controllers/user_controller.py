from flask import Blueprint, render_template, abort, redirect, url_for, jsonify, session
from repositories.repository_factory import RepositoryFactory
from core.db_singleton import DatabaseConnection

user_bp = Blueprint("user", __name__, url_prefix="/api/v1/users")

@user_bp.route("/", methods=["GET"])
def list_all_users():
    repo = RepositoryFactory.get_repository("user")
    users = repo.get_all()
    return jsonify([u.to_dict() for u in users]), 200

@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user_by_id(user_id):
    repo = RepositoryFactory.get_repository("user")
    user = repo.get_by_id(user_id)
    
    if user:
        return jsonify(user.to_dict()), 200
    else:
        abort(404, description="User not found")

@user_bp.route("/delete", methods=["DELETE"])
def delete_user_account():
    """Delete the current user account from database"""
    try:
        from flask import request
        data = request.get_json() or {}
        
        # Get user ID from request body or session
        user_id = data.get('user_id') or session.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required or not authenticated'}), 401
        
        # Get user repository and verify user exists
        repo = RepositoryFactory.get_repository("user")
        user = repo.get_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete all related records first (to handle foreign key constraints)
        db = DatabaseConnection().connection
        cursor = db.cursor()
        
        try:
            # Delete tasks created by this user
            cursor.execute("DELETE FROM task WHERE created_by=%s", (user_id,))
            
            # Delete user project associations
            cursor.execute("DELETE FROM user_project WHERE user_id=%s", (user_id,))
            
            # Delete notifications for this user
            cursor.execute("DELETE FROM notification WHERE user_id=%s", (user_id,))
            
            # Delete file attachments uploaded by this user
            cursor.execute("DELETE FROM file_attachment WHERE uploaded_by=%s", (user_id,))
            
            # Finally delete the user
            success = repo.delete(user_id)
            
            if not success:
                db.rollback()
                return jsonify({'error': 'Failed to delete user'}), 500
            
            db.commit()
            
            # Clear session
            session.clear()
            
            return jsonify({'success': True, 'message': 'Account and all related data deleted successfully'}), 200
        
        except Exception as inner_e:
            db.rollback()
            raise inner_e
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500