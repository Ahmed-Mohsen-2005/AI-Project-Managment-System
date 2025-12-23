from flask import Blueprint, request, jsonify, session
from flask import Blueprint, request, jsonify, url_for, render_template
from services.auth_service import AuthService
from flask_mail import Message
from extensions import mail  # FIX: Pull from extensions, NOT from appfrom flask import request, jsonify, url_for, render_template
from repositories.repository_factory import RepositoryFactory


auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
auth_service = AuthService() # Instantiate the service

@auth_bp.route("/register", methods=["POST"])
def register():
    """Endpoint for user registration."""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({"message": "Missing required fields."}), 400

    success, user, message = auth_service.register_user(name, email, password)

    if success:
        # Successfully created user. Return sanitized data.
        return jsonify({
            "message": message,
            "user": user.to_dict()
        }), 201
    else:
        return jsonify({"message": message}), 409 # 409 Conflict for existing resource

@auth_bp.route("/login", methods=["POST"])
def login():
    """Endpoint for user login. Checks if user has admin role."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"message": "Missing email or password."}), 400

    # Authenticate user with email and password
    success, user, message = auth_service.login_user(email, password)
    
    if success:
        # Check if user has admin role (case-insensitive)
        is_admin = hasattr(user, 'role') and user.role and user.role.lower() == 'admin'
        
        if is_admin:
            # Set admin session
            session['admin_user'] = user.user_id
            session['admin_email'] = user.email
        
        # Return user info with admin status
        return jsonify({
            "message": message,
            "user": user.to_dict(),
            "is_admin": is_admin
        }), 200
    else:
        return jsonify({"message": message}), 401 # 401 Unauthorized
# In controllers/auth_controller.py


@auth_bp.route("/update-password", methods=["POST"])
def update_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('password')

    if not email or not new_password:
        return jsonify({"message": "Invalid request"}), 400

    # AuthService handles the generate_password_hash
    success = auth_service.reset_password(email, new_password)

    if success:
        return jsonify({"message": "Password updated successfully"}), 200
    return jsonify({"message": "Error updating database"}), 500

from flask_mail import Message
from extensions import mail

import socket

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    success, message = auth_service.request_password_reset(email)

    if success:
        reset_url = url_for('auth.reset_password_page', email=email, _external=True)
        
        # We always print to terminal so you can use the system even if email fails
        print(f"\n[TERMINAL RESET LINK]: {reset_url}\n")

        msg = Message(
            subject="Password Reset - AIPMS",
            recipients=[email],
            body=f"Click here to reset: {reset_url}"
        )
        
        try:
            # Set a socket timeout so the web app doesn't wait forever
            socket.setdefaulttimeout(10) 
            mail.send(msg)
            return jsonify({"message": "Email sent! Check your inbox."}), 200
        except Exception as e:
            print(f"SMTP Connection Failed: {e}")
            # If email fails, we tell the user the link is in the console for dev purposes
            return jsonify({
                "message": "Mail server timeout. The reset link has been printed to the developer terminal."
            }), 200 
            
    return jsonify({"message": message}), 404

@auth_bp.route("/reset-password/<email>", methods=["GET"])
def reset_password_page(email):
    """Renders the actual form to type a new password."""
    # We pass 't' for translations and 'email' to identify the user
    return render_template("reset_password_form.html", email=email)