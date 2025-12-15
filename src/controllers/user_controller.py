from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

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