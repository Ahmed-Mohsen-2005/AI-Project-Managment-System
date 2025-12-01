from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

integration_bp = Blueprint("integration", __name__, url_prefix="/api/v1/integrations")

@integration_bp.route("/", methods=["GET"])
def list_all_notifications():
    repo = RepositoryFactory.get_repository("integration")
    integrations = repo.get_all()
    return jsonify([i.to_dict() for i in integrations]), 200
