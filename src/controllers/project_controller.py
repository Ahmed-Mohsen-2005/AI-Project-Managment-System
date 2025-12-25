from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from repositories.repository_factory import RepositoryFactory
from models.project import Project
from services.github_service import GitHubService


project_bp = Blueprint("project", __name__, url_prefix="/api/v1/projects")

@project_bp.route("/", methods=["GET"])
def list_all_projects():
    repo = RepositoryFactory.get_repository("project")
    projects = repo.get_all()
    return jsonify([p.to_dict() for p in projects]), 200
@project_bp.route('/projects/<int:project_id>/dashboard')
def project_dashboard(project_id):
    """
    Displays the specific dashboard for a single project,
    showing its database info AND live GitHub commits.
    """
    project_repo = RepositoryFactory.get_repository("project")
    project = project_repo.get_by_id(project_id)
    
    if not project:
        return render_template('404.html'), 404

    # Fetch Live GitHub Data if linked
    github_commits = []
    if project.github_repo and 'github_token' in session:
        try:
            # We will define this method in Step 2
            github_commits = GitHubService.get_project_commits(
                session['github_token'], 
                project.github_repo
            )
        except Exception as e:
            print(f"Error fetching project commits: {e}")

    return render_template(
        'project_dashboard.html', 
        project=project, 
        commits=github_commits
    )
# ADD THIS ROUTE
@project_bp.route('/api/projects/all', methods=['GET'])
def get_all_projects_api():
    """
    API used by the repositories.js 'Link' modal 
    to populate the dropdown list.
    """
    try:
        project_repo = RepositoryFactory.get_repository("project")
        projects = project_repo.get_all()
        
        # Convert objects to simple JSON dictionary
        data = [{'id': p.project_id, 'name': p.name} for p in projects]
        
        return jsonify({'projects': data})
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return jsonify({'projects': []}), 500
@project_bp.route('/projects/create', methods=['GET', 'POST'])
def create_project():
    project_repo = RepositoryFactory.get_repository("project")

    # --- GET REQUEST: Show the Form ---
    if request.method == 'GET':
        # 1. Fetch GitHub Repos (if user is connected)
        github_repos = []
        if 'github_token' in session:
            github_repos = GitHubService.get_user_repos(session['github_token'])
        
        # 2. Render Template with the list
        return render_template('create_project.html', user_repos=github_repos)

    # --- POST REQUEST: Process the Form ---
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        budget = request.form.get('budget')
        
        # 3. Get the selected Repo from the dropdown
        github_repo_link = request.form.get('github_repo') 
        if github_repo_link == "": 
            github_repo_link = None

        # 4. Create Project Object
        new_project = Project(
            name=name,
            description=description,
            start_date=start_date,
            end_date=end_date,
            budget=budget,
            # Pass the repo link to the object (ensure Project model has this field or handled dynamically)
        )
        # Monkey-patching specifically for the repo link if not in Model __init__
        new_project.github_repo = github_repo_link 

        # 5. Save to DB
        # The repository.create() method we updated earlier will look for .github_repo
        project_repo.create(new_project)

        return redirect(url_for('dashboard'))