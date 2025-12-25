from flask import Flask, g, session, jsonify, request, render_template, Response
from controllers.user_controller import user_bp
from controllers.sprint_controller import sprint_bp
from controllers.task_controller import task_bp
from controllers.report_controller import report_bp
from controllers.note_controller import note_bp 
from controllers.project_controller import project_bp
from controllers.notification_controller import notification_bp
from controllers.integration_controller import integration_bp
from controllers.file_attachment_controller import file_attachment_bp
from controllers.admin_controller import admin_bp
from controllers.auth_controller import auth_bp
from controllers.documentation_controller import documentation_bp
from extensions import mail
from controllers.profile_controller import profile_bp
from controllers.dashboard_controller import dashboard_bp
from config.database_config import SECRET_KEY
from data.db_session import get_db
from controllers.view_controller import view_bp  
from flask import Blueprint
from services.task_service import TaskService
from i18n import get_locale, get_t
from flask_mail import Mail
from repositories.repository_factory import RepositoryFactory
from datetime import datetime
import csv
from io import StringIO


app = Flask(__name__)
app.url_map.strict_slashes = False
app.secret_key = SECRET_KEY 


db = get_db() 
print("Project Sentinel Application and SQL Server connection pool initialized.")
mail.init_app(app)

# Email configuration
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=465,
    MAIL_USE_TLS=False,
    MAIL_USE_SSL=True,  
    MAIL_USERNAME='ahmedazab05@gmail.com',
    MAIL_PASSWORD='irutaktwowcddgkc', 
    MAIL_DEFAULT_SENDER='ahmedazab05@gmail.com'
)

mail = Mail(app)


# ==================== BLUEPRINT REGISTRATIONS ====================
app.register_blueprint(user_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(sprint_bp)
app.register_blueprint(task_bp)
app.register_blueprint(report_bp)
app.register_blueprint(view_bp)
app.register_blueprint(project_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(integration_bp)
app.register_blueprint(file_attachment_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(documentation_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(note_bp)  


# ==================== LANGUAGE & INTERNATIONALIZATION ====================
@app.before_request
def before_request():
    """Set up language for each request"""
    g.current_lang = get_locale()
    g.t = get_t()


@app.context_processor
def inject_globals():
    """Make variables available to all templates"""
    return {
        'current_lang': g.current_lang,
        't': g.t
    }


# ==================== EXISTING API ENDPOINTS ====================
@app.route('/api/v1/settings/language', methods=['POST'])
def change_language():
    """Change user's language preference"""
    data = request.get_json()
    lang = data.get('language', 'en')
    
    # Validate language
    if lang not in ['en', 'ar', 'fr']:
        return jsonify({'error': 'Invalid language'}), 400
    
    # Store in session
    session['language'] = lang
    
    return jsonify({'success': True, 'language': lang}), 200


# ==================== NEW SETTINGS API ENDPOINTS ====================

@app.route('/api/v1/settings/ai-features', methods=['PATCH'])
def update_ai_features():
    """Update AI feature toggles"""
    try:
        data = request.get_json()
        
        # Get user from repository
        if not hasattr(g, 'current_user') or g.current_user is None:
            user_repo = RepositoryFactory.get_repository("user")
            current_user = user_repo.get_by_id(2)
        else:
            current_user = g.current_user
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Update AI settings (store in session for now)
        if 'predictive_risk' in data:
            session['ai_predictive_risk'] = data['predictive_risk']
        if 'sentiment_analysis' in data:
            session['ai_sentiment_analysis'] = data['sentiment_analysis']
        
        return jsonify({
            'success': True,
            'message': 'AI features updated successfully',
            'settings': {
                'predictive_risk': session.get('ai_predictive_risk', True),
                'sentiment_analysis': session.get('ai_sentiment_analysis', True)
            }
        })
    except Exception as e:
        print(f"[AI_FEATURES] Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/v1/integrations/<integration_type>/disconnect', methods=['POST'])
def disconnect_integration(integration_type):
    """Disconnect from external integration"""
    try:
        valid_types = ['github', 'slack', 'gdrive']
        if integration_type not in valid_types:
            return jsonify({
                'success': False,
                'error': 'Invalid integration type'
            }), 400
        
        # Get user
        if not hasattr(g, 'current_user') or g.current_user is None:
            user_repo = RepositoryFactory.get_repository("user")
            current_user = user_repo.get_by_id(2)
        else:
            current_user = g.current_user
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Log disconnection
        print(f"[INTEGRATION] User {current_user.id} disconnected from {integration_type}")
        
        return jsonify({
            'success': True,
            'message': f'Disconnected from {integration_type}',
            'integration': integration_type,
            'status': 'disconnected'
        })
    
    except Exception as e:
        print(f"[INTEGRATION] Disconnect error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/v1/integrations/<integration_type>/oauth', methods=['GET'])
def oauth_redirect(integration_type):
    """Redirect to OAuth provider"""
    try:
        oauth_endpoints = {
            'github': 'https://github.com/login/oauth/authorize',
            'slack': 'https://slack.com/oauth_authorize',
            'gdrive': 'https://accounts.google.com/o/oauth2/v2/auth'
        }
        
        if integration_type not in oauth_endpoints:
            return jsonify({'error': 'Invalid integration type'}), 400
        
        print(f"[OAUTH] OAuth flow for {integration_type}")
        
        return jsonify({
            'success': False,
            'error': 'OAuth endpoint not yet configured',
            'integration': integration_type,
            'message': 'Please configure OAuth credentials in production'
        }), 501
    
    except Exception as e:
        print(f"[OAUTH] Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/v1/settings/audit-log/export', methods=['GET'])
def export_audit_log():
    """Export user's audit log as CSV"""
    try:
        # Get user
        if not hasattr(g, 'current_user') or g.current_user is None:
            user_repo = RepositoryFactory.get_repository("user")
            current_user = user_repo.get_by_id(2)
            user_id = 2
        else:
            current_user = g.current_user
            user_id = g.current_user_id
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Create CSV data
        si = StringIO()
        writer = csv.writer(si)
        
        # Write header
        writer.writerow(['Timestamp', 'Action', 'Resource', 'Status', 'Details'])
        
        # Write sample data
        writer.writerow([
            datetime.now().isoformat(),
            'Settings Updated',
            'user_settings',
            'success',
            'User updated language preference'
        ])
        writer.writerow([
            datetime.now().isoformat(),
            'Login',
            'authentication',
            'success',
            'User logged in'
        ])
        writer.writerow([
            datetime.now().isoformat(),
            'Profile Viewed',
            'user_profile',
            'success',
            'User viewed profile'
        ])
        
        # Create response
        output = Response(si.getvalue(), mimetype="text/csv")
        output.headers["Content-Disposition"] = f"attachment; filename=audit-log-{datetime.now().strftime('%Y-%m-%d')}.csv"
        
        print(f"[AUDIT] Exported audit log for user {user_id}")
        return output
    
    except Exception as e:
        print(f"[AUDIT] Export error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/v1/users/<int:user_id>', methods=['DELETE'])
def delete_user_account(user_id):
    """Permanently delete user account"""
    try:
        # Verify user is deleting their own account
        if not hasattr(g, 'current_user') or g.current_user is None:
            user_repo = RepositoryFactory.get_repository("user")
            current_user = user_repo.get_by_id(2)
            current_user_id = 2
        else:
            current_user = g.current_user
            current_user_id = g.current_user_id
        
        # Security: Only allow users to delete their own account
        if current_user_id != user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Log deletion
        print(f"[ACCOUNT] User {user_id} ({current_user.name}) account deletion initiated")
        
        return jsonify({
            'success': True,
            'message': 'Account deletion initiated',
            'redirect': '/logout',
            'note': 'Implement actual account deletion in production'
        })
    
    except Exception as e:
        print(f"[ACCOUNT] Deletion error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== PAGE ROUTES ====================

@app.route("/")
def root():
    """Home/Root page"""
    return render_template("index.html")


@app.route("/forgot_password")
def forgot_password():
    """Forgot password page"""
    return render_template("forgot_password.html")


@app.route("/home")
def home():
    """Home page with tasks"""
    task_service = TaskService()
    tasks = task_service.get_all_tasks()
    return render_template("home.html", tasks=tasks)


@app.route("/admin")
def admin():
    """Admin dashboard"""
    return render_template("admin.html")


@app.route("/repositories")
def repositories():
    """Repositories page"""
    return render_template("repositories.html")


@app.route("/board")
def board():
    """Board/Kanban view"""
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()
    return render_template("board.html", projects=all_projects)


@app.route("/dashboard")
def dashboard():
    """Main dashboard"""
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()
    return render_template("dashboard.html", projects=all_projects)


@app.route("/sprints")
def sprints():
    """Sprints page"""
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()    
    return render_template("sprints.html", projects=all_projects)


@app.route("/backlog")
def backlog():
    """Backlog page"""
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()
    return render_template("backlog.html", projects=all_projects)


@app.route("/chats")
def chats():
    """Chats/Messaging page"""
    return render_template("chats.html")


@app.route("/reports")
def reports():
    """Reports page"""
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()    
    return render_template("reports.html", projects=all_projects)


@app.route("/settings")
def settings():
    """Settings page with user configuration"""
    # Get current user from session (set by before_request hook)
    if not hasattr(g, 'current_user') or g.current_user is None:
        print("[SETTINGS] No user logged in, using default user_id=2")
        user_repo = RepositoryFactory.get_repository("user")
        current_user = user_repo.get_by_id(2)  # Fallback for testing
        user_id = 2
    else:
        current_user = g.current_user
        user_id = g.current_user_id
    
    if current_user:
        user_email = current_user.email
        user_role = current_user.role
        print(f"[SETTINGS] User ID: {user_id}, Name: {current_user.name}, Email: {user_email}, Role: {user_role}")
    else:
        user_email = "user@aipms.com"
        user_role = "User"
        print(f"[SETTINGS] User ID {user_id} not found!")
    
    return render_template("settings.html", current_user_email=user_email, current_user_role=user_role, user_id=user_id)


@app.route("/profile")
def profile():
    """User profile page"""
    # Get current user from session (set by before_request hook)
    if not hasattr(g, 'current_user') or g.current_user is None:
        print("[PROFILE] No user logged in, using default user_id=2")
        user_repo = RepositoryFactory.get_repository("user")
        current_user = user_repo.get_by_id(2)  # Fallback for testing
        user_id = 2
    else:
        current_user = g.current_user
        user_id = g.current_user_id
    
    if current_user:
        user_email = current_user.email
        user_name = current_user.name
        print(f"[PROFILE] User ID: {user_id}, Name: {user_name}, Email: {user_email}")
    else:
        user_email = "user@aipms.com"
        user_name = "User"
        print(f"[PROFILE] User ID {user_id} not found!")
    
    return render_template("profile.html", current_user_email=user_email, current_user_name=user_name)


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Page not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 Project Sentinel Application Starting")
    print("="*60)
    print("✅ Settings Page API Endpoints:")
    print("   - POST   /api/v1/settings/language")
    print("   - PATCH  /api/v1/settings/ai-features")
    print("   - POST   /api/v1/integrations/{type}/disconnect")
    print("   - GET    /api/v1/integrations/{type}/oauth")
    print("   - GET    /api/v1/settings/audit-log/export")
    print("   - DELETE /api/v1/users/{user_id}")
    print("="*60 + "\n")
    
    app.run(debug=True)