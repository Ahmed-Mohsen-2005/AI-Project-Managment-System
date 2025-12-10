from flask import Blueprint, request, jsonify
from services.auth_service import AuthService

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
    """Endpoint for user login."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"message": "Missing email or password."}), 400

    success, user, message = auth_service.login_user(email, password)
    
    if success:
        # IMPORTANT: In a real app, you would create a JWT token or set a Flask session here.
        return jsonify({
            "message": message,
            "user": user.to_dict(), # Return user info (excluding hash)
            # "token": "your_generated_jwt_token_here" 
        }), 200
    else:
        return jsonify({"message": message}), 401 # 401 Unauthorized