import hmac
import hashlib
import requests
from flask import Blueprint, redirect, request, session, url_for, jsonify, current_app, render_template
from services.github_service import GitHubService

integration_bp = Blueprint('integration', __name__, url_prefix='/integration')

# =========================================================
#  HELPER: Webhook Security
# =========================================================
def verify_github_signature(payload, signature, secret):
    """Verifies that the webhook request came from GitHub."""
    if not signature or not secret:
        return False
    
    mac = hmac.new(secret.encode('utf-8'), msg=payload, digestmod=hashlib.sha256)
    expected_signature = 'sha256=' + mac.hexdigest()
    return hmac.compare_digest(expected_signature, signature)

# =========================================================
#  1. AUTHENTICATION (OAuth Flow)
# =========================================================

@integration_bp.route('/github/connect')
def connect_github():
    auth_url = GitHubService.get_auth_url()
    return redirect(auth_url)

@integration_bp.route('/github/callback')
def github_callback():
    code = request.args.get('code')
    if code:
        token = GitHubService.get_token(code)
        if token:
            session['github_token'] = token
    return redirect(url_for('view.repositories'))

@integration_bp.route('/github/disconnect')
def disconnect_github():
    session.pop('github_token', None)
    return redirect(url_for('view.repositories'))

# =========================================================
#  2. API ENDPOINTS
# =========================================================

@integration_bp.route('/api/repos', methods=['GET'])
def get_repos():
    token = session.get('github_token')
    if not token:
        return jsonify({'connected': False, 'repositories': []})
    
    repos = GitHubService.get_user_repos(token)
    formatted_repos = []
    
    if repos:
        for repo in repos:
            formatted_repos.append({
                'name': repo['name'],
                'updated': repo.get('updated_at', '').split('T')[0],
                'owner': repo['owner']['login'],
                'status': 'Active' if not repo['archived'] else 'Archived',
                'is_private': repo['private'],
                'url': repo['html_url']
            })
        
    return jsonify({'connected': True, 'repositories': formatted_repos})

@integration_bp.route('/api/repos/create', methods=['POST'])
def create_repo():
    token = session.get('github_token')
    if not token:
        return jsonify({'success': False, 'message': 'Not connected to GitHub'}), 401

    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    is_private = data.get('is_private', False)

    if not name:
        return jsonify({'success': False, 'message': 'Repository name is required'}), 400

    response = GitHubService.create_repository(token, name, description, is_private)
    
    if response.status_code == 201:
        repo_data = response.json()
        return jsonify({
            'success': True, 
            'message': f'Repository "{name}" created successfully!',
            'repo': {'name': repo_data['name'], 'url': repo_data['html_url']}
        })
    else:
        error_msg = response.json().get('message', 'Unknown error')
        return jsonify({'success': False, 'message': f'GitHub Error: {error_msg}'}), response.status_code

@integration_bp.route('/api/settings/update', methods=['POST'])
def update_settings():
    data = request.get_json()
    session['gh_notify_pr'] = data.get('notify_pr')
    session['gh_notify_merge'] = data.get('notify_merge')
    session['gh_notify_ci'] = data.get('notify_ci')
    return jsonify({'success': True, 'message': 'Settings saved'})

# =========================================================
#  3. WEBHOOK LISTENER (The Duplicate culprit)
# =========================================================

@integration_bp.route('/webhook/github', methods=['POST', 'GET'])
def github_webhook():
    # 1. VISUAL DASHBOARD (Browser Request)
    if request.method == 'GET':
        webhook_url = url_for('integration.github_webhook', _external=True)
        secret = current_app.config.get('GITHUB_WEBHOOK_SECRET', 'Not Configured')
        
        token = session.get('github_token')
        dashboard_data = None
        if token:
            dashboard_data = GitHubService.get_dashboard_activity(token)
        
        return render_template(
            'webhook_status.html', 
            webhook_url=webhook_url, 
            secret=secret,
            data=dashboard_data,
            is_connected=bool(token)
        )

    # 2. WEBHOOK LOGIC (GitHub Request)
    signature = request.headers.get('X-Hub-Signature-256')
    webhook_secret = current_app.config.get('GITHUB_WEBHOOK_SECRET')
    
    if not verify_github_signature(request.data, signature, webhook_secret):
        return jsonify({'success': False, 'message': 'Invalid signature'}), 401

    event_type = request.headers.get('X-GitHub-Event')
    payload = request.json
    
    # Process Events
    if event_type == 'ping':
        return jsonify({'success': True, 'message': 'Ping received!'}), 200

    elif event_type == 'push':
        # Push logic here
        pass
    
    elif event_type == 'pull_request':
        # PR logic here
        pass
        
    return jsonify({'success': True}), 200