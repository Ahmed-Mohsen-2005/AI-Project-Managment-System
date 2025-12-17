from flask import Blueprint, request, jsonify
from repositories.repository_factory import RepositoryFactory
from models.project import Project

project_bp = Blueprint("project", __name__, url_prefix="/api/v1/projects")

@project_bp.route("/", methods=["GET"])
def list_all_projects():
    repo = RepositoryFactory.get_repository("project")
    projects = repo.get_all()
    return jsonify([p.to_dict() for p in projects]), 200

# ADD THIS ROUTE
@project_bp.route("/", methods=["POST"])
def create_project():
    data = request.get_json()
    
    # Basic Validation
    if not data.get('name') or not data.get('start_date'):
        return jsonify({"error": "Name and Start Date are required"}), 400

    try:
        new_project = Project(
            name=data.get('name'),
            description=data.get('description', ''),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            budget=data.get('budget', 0.0)
        )
        
        repo = RepositoryFactory.get_repository("project")
        new_id = repo.create(new_project)
        
        return jsonify({"message": "Project created successfully", "project_id": new_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500