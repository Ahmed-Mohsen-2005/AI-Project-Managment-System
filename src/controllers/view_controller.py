from flask import Blueprint, render_template
from repositories.repository_factory import RepositoryFactory

# Note: No "url_prefix" here, or a simple "/" prefix, 
# so these routes are at the root level (e.g. localhost:5000/sprints)
view_bp = Blueprint("view", __name__)

@view_bp.route("/sprints", methods=["GET"])
def sprints_page():
    project_repo = RepositoryFactory.get_repository("project")
    projects = project_repo.get_all()
    print(f"DEBUG: Found {len(projects)} projects") 
    return render_template("board/sprints.html", projects=projects)