from flask import Blueprint, request, jsonify, make_response, render_template
from repositories.repository_factory import RepositoryFactory
from models.sprint import Sprint 

sprint_bp = Blueprint("sprint", __name__, url_prefix="/api/v1/sprints")

@sprint_bp.route("/", methods=["GET"])
def list_all_sprints():
    project_id = request.args.get('project_id')
    repo = RepositoryFactory.get_repository("sprint")

    if project_id and project_id != 'all':
        sprints = repo.get_by_project_id(project_id)
    else:
        sprints = repo.get_all()
        
    return jsonify([s.to_dict() for s in sprints]), 200

@sprint_bp.route("/", methods=["POST"])
def create_sprint():
    data = request.get_json()
    try:
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

# --- NEW: GET SINGLE SPRINT (Fixes "Could not load sprint data") ---
@sprint_bp.route("/<int:sprint_id>", methods=["GET"])
def get_sprint(sprint_id):
    repo = RepositoryFactory.get_repository("sprint")
    sprint = repo.get_by_id(sprint_id) # Assuming your repo has get_by_id
    
    if sprint:
        return jsonify(sprint.to_dict()), 200
    return jsonify({"error": "Sprint not found"}), 404

# --- NEW: UPDATE SPRINT (Saves Edit Modal changes) ---
@sprint_bp.route("/<int:sprint_id>", methods=["PUT"])
def update_sprint(sprint_id):
    data = request.get_json()
    repo = RepositoryFactory.get_repository("sprint")
    
    # Assuming your repository has an update method that takes id and dictionary
    success = repo.update(sprint_id, {
        "name": data.get('name'),
        "start_date": data.get('start_date'),
        "end_date": data.get('end_date')
    })
    
    if success:
        return jsonify({"message": "Sprint updated"}), 200
    return jsonify({"error": "Update failed"}), 500

# --- FIXED: UPDATE STATUS (Removed redundant /api/v1/sprints from route) ---
# REMOVE: @sprint_bp.route('/api/v1/sprints/<int:sprint_id>/status', ...)
# USE THIS INSTEAD:
@sprint_bp.route('/<int:sprint_id>/status', methods=['PATCH'])
def update_sprint_status(sprint_id):
    data = request.get_json()
    new_status = data.get('status') 

    repo = RepositoryFactory.get_repository("sprint")
    
    try:
        # This calls the method we added to your SprintRepository
        success = repo.update_status(sprint_id, new_status)
        
        if success:
            return jsonify({"message": "Status updated", "new_status": new_status}), 200
        else:
            return jsonify({"error": "No changes made to the database"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@sprint_bp.route("", methods=["GET"])
def get_all_sprints():
    sprint_repo = RepositoryFactory.get_repository("sprint")
    sprints = sprint_repo.get_all()
    return jsonify([s.to_dict() for s in sprints]), 200