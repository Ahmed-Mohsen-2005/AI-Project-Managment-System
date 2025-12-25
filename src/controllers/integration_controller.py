from flask import Blueprint, redirect, request, session, url_for, jsonify, current_app
from services.github_service import GitHubService

integration_bp = Blueprint('integration', __name__, url_prefix='/integration')

# 1. Start the OAuth Process
@integration_bp.route('/github/connect')
def connect_github():
    auth_url = GitHubService.get_auth_url()
    return redirect(auth_url)

# 2. Handle the Callback from GitHub
@integration_bp.route('/github/callback')
def github_callback():
    code = request.args.get('code')
    if code:
        token = GitHubService.get_token(code)
        if token:
            session['github_token'] = token
            # Optional: Store token in DB linked to g.current_user here
    
    # Redirect back to your repositories page
    return redirect(url_for('repositories')) # Assuming 'view' is the blueprint for your pages

# 3. API for Frontend to fetch Repos
@integration_bp.route('/api/repos')
def get_repos():
    token = session.get('github_token')
    if not token:
        return jsonify({'connected': False, 'repositories': []})
    
    repos = GitHubService.get_user_repos(token)
    
    # Format data for your specific frontend table
    formatted_repos = []
    for repo in repos:
        formatted_repos.append({
            'name': repo['name'],
            'updated': repo['updated_at'].split('T')[0], # Simple date formatting
            'owner': repo['owner']['login'],
            'status': 'Active' if not repo['archived'] else 'Archived',
            'url': repo['html_url']
        })
        
    return jsonify({'connected': True, 'repositories': formatted_repos})

@integration_bp.route('/github/disconnect')
def disconnect_github():
    session.pop('github_token', None)
    return redirect(url_for('view.repositories'))