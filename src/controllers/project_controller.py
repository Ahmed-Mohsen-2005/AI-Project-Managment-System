from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

project_bp = Blueprint("project", __name__, url_prefix="/api/v1/projects")

@project_bp.route("/", methods=["GET"])
def list_all_reports():
    repo = RepositoryFactory.get_repository("project")
    projects = repo.get_all()
    return jsonify([p.to_dict() for p in projects]), 200
