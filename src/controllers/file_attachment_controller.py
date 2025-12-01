from flask import Blueprint, render_template, abort, redirect, url_for, jsonify
from repositories.repository_factory import RepositoryFactory

file_attachment_bp = Blueprint("file", __name__, url_prefix="/api/v1/files")

@file_attachment_bp.route("/", methods=["GET"])
def list_all_notifications():
    repo = RepositoryFactory.get_repository("file")
    files = repo.get_all()
    return jsonify([f.to_dict() for f in files]), 200
