from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

notification_bp = Blueprint("notification", __name__, url_prefix="/api/v1/notifications")

@notification_bp.route("/", methods=["GET"])
def list_all_notifications():
    repo = RepositoryFactory.get_repository("notification")
    notifications = repo.get_all()
    return jsonify([n.to_dict() for n in notifications]), 200
