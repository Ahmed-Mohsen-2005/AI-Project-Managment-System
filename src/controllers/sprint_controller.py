from flask import Blueprint, request, jsonify, make_response
from repositories.repository_factory import RepositoryFactory
from models.sprint import Sprint 

sprint_bp = Blueprint("sprint", __name__, url_prefix="/api/v1/sprints")

@sprint_bp.route("/", methods=["GET"])
def list_all_sprints():
    # Optional: Filter by project_id if passed in URL (e.g., ?project_id=1)
    project_id = request.args.get('project_id')
    repo = RepositoryFactory.get_repository("sprint")

    if project_id:
        # Assuming you added get_by_project_id to the repo as suggested previously
        sprints = repo.get_by_project_id(project_id)
    else:
        sprints = repo.get_all()
        
    return jsonify([s.to_dict() for s in sprints]), 200
@sprint_bp.route("/", methods=["POST"])
def create_sprint():
    data = request.get_json()
    
    # ... checks ...

    try:
        # ERROR IS HERE: You are likely passing 'status=...' here
        new_sprint = Sprint(
            project_id=data.get('project_id'),
            name=data.get('name'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            velocity=data.get('velocity', 0.0) 
        )
        
        repo = RepositoryFactory.get_repository("sprint")
        new_id = repo.create(new_sprint)
        
        return jsonify({"message": "Sprint created", "sprint_id": new_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500