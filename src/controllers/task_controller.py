from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

task_bp = Blueprint("task", __name__, url_prefix="/api/v1/tasks")

@task_bp.route("/", methods=["GET"])
def list_all_tasks():
    repo = RepositoryFactory.get_repository("task")
    tasks = repo.get_all()
    return jsonify([t.to_dict() for t in tasks]), 200
