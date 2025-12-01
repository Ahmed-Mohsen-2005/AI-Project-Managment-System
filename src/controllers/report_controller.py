from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

report_bp = Blueprint("report", __name__, url_prefix="/api/v1/reports")

@report_bp.route("/", methods=["GET"])
def list_all_reports():
    repo = RepositoryFactory.get_repository("report")
    reports = repo.get_all()
    return jsonify([r.to_dict() for r in reports]), 200
