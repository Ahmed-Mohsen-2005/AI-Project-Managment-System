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

@user_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user_account(user_id):
    """Delete user account and all related data from database"""
    try:
        # Get user repository and verify user exists
        repo = RepositoryFactory.get_repository("user")
        user = repo.get_by_id(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get database connection
        conn = DatabaseConnection().get_connection()
        cursor = conn.cursor()

        try:
            # Delete all related records first (to handle foreign key constraints)

            # 1. Delete user skills
            cursor.execute("DELETE FROM userskill WHERE user_id=%s", (user_id,))
            print(f"[DELETE] Deleted {cursor.rowcount} skills for user {user_id}")

            # 2. Delete user activities
            cursor.execute("DELETE FROM useractivity WHERE user_id=%s", (user_id,))
            print(f"[DELETE] Deleted {cursor.rowcount} activities for user {user_id}")

            # 3. Unassign tasks (set assigned_id to NULL instead of deleting)
            cursor.execute("UPDATE Task SET assigned_id=NULL WHERE assigned_id=%s", (user_id,))
            print(f"[DELETE] Unassigned {cursor.rowcount} tasks from user {user_id}")

            # 4. Update tasks created by this user (set created_by to NULL)
            cursor.execute("UPDATE Task SET created_by=NULL WHERE created_by=%s", (user_id,))
            print(f"[DELETE] Updated {cursor.rowcount} tasks created by user {user_id}")

            # 5. Delete user project associations
            cursor.execute("DELETE FROM user_project WHERE user_id=%s", (user_id,))
            print(f"[DELETE] Deleted {cursor.rowcount} project associations for user {user_id}")

            # 6. Delete notifications for this user (if table exists)
            try:
                cursor.execute("DELETE FROM notification WHERE user_id=%s", (user_id,))
                print(f"[DELETE] Deleted {cursor.rowcount} notifications for user {user_id}")
            except Exception as e:
                print(f"[DELETE] Notification table might not exist or error: {e}")

            # 7. Update file attachments (set uploaded_by to NULL)
            try:
                cursor.execute("UPDATE file_attachment SET uploaded_by=NULL WHERE uploaded_by=%s", (user_id,))
                print(f"[DELETE] Updated {cursor.rowcount} file attachments for user {user_id}")
            except Exception as e:
                print(f"[DELETE] File attachment table might not exist or error: {e}")

            # 8. Finally delete the user from userr table
            cursor.execute("DELETE FROM userr WHERE user_id=%s", (user_id,))
            deleted_count = cursor.rowcount

            if deleted_count == 0:
                conn.rollback()
                cursor.close()
                conn.close()
                return jsonify({'error': 'Failed to delete user'}), 500

            # Commit all changes
            conn.commit()
            print(f"[DELETE] Successfully deleted user {user_id} and all related data")

            # Clear session
            session.clear()

            cursor.close()
            conn.close()

            return jsonify({
                'success': True,
                'message': 'Account and all related data deleted successfully'
            }), 200

        except Exception as inner_e:
            conn.rollback()
            cursor.close()
            conn.close()
            raise inner_e

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500