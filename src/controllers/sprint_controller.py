from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

sprint_bp = Blueprint("sprint", __name__, url_prefix="/api/v1/sprints")

@sprint_bp.route("/", methods=["GET"])
def list_all_sprints():
    repo = RepositoryFactory.get_repository("sprint")
    sprints = repo.get_all()
    return jsonify([s.to_dict() for s in sprints]), 200
