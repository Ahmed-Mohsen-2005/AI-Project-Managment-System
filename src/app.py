from flask import Flask, g, session, jsonify, request
from controllers.user_controller import user_bp
from controllers.sprint_controller import sprint_bp
from controllers.documentation_controller import docs_bp
from controllers.task_controller import task_bp
from controllers.report_controller import report_bp
from controllers.note_controller import note_bp 
from controllers.project_controller import project_bp
from controllers.notification_controller import notification_bp
from controllers.integration_controller import integration_bp
from controllers.file_attachment_controller import file_attachment_bp
from controllers.admin_controller import admin_bp
from controllers.auth_controller import auth_bp
from extensions import mail
from controllers.profile_controller import profile_bp
from controllers.dashboard_controller import dashboard_bp
from config.database_config import SECRET_KEY
from data.db_session import get_db
from controllers.view_controller import view_bp  
from flask import Blueprint, render_template
from services.task_service import TaskService
from i18n import get_locale, get_t
from flask_mail import Mail

app = Flask(__name__)
app.url_map.strict_slashes = False
app.secret_key = SECRET_KEY 

from repositories.repository_factory import RepositoryFactory
db = get_db() 
print("Project Sentinel Application and SQL Server connection pool initialized.")
mail.init_app(app)
# app.py or extensions.py
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
app.register_blueprint(docs_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(note_bp)  
# In your main controller or app.py where the page is served

# ✅ LANGUAGE SETUP - Runs before every request
@app.before_request
def before_request():
    """Set up language for each request"""
    g.current_lang = get_locale()
    g.t = get_t()

# ✅ Make language variables available to ALL templates
@app.context_processor
def inject_globals():
    """Make variables available to all templates"""
    return {
        'current_lang': g.current_lang,
        't': g.t
    }

# ✅ API ENDPOINT - Language change
@app.route('/api/v1/settings/language', methods=['POST'])
def change_language():
    data = request.get_json()
    lang = data.get('language', 'en')
    
    # Validate language
    if lang not in ['en', 'ar']:
        return jsonify({'error': 'Invalid language'}), 400
    
    # Store in session
    session['language'] = lang
    
    return jsonify({'success': True, 'language': lang}), 200

# Your existing routes
@app.route("/")
def root():
    return render_template("index.html")
@app.route("/forgot_password")
def forgot_password():
    return render_template("forgot_password.html")

@app.route("/home")
def home():
    task_service = TaskService()
    tasks = task_service.get_all_tasks()
    return render_template("home.html", tasks=tasks)

@app.route("/admin")
def admin():
    return render_template("admin.html")

@app.route("/repositories")
def repositories():
    return render_template("repositories.html")

@app.route("/board")
def board():
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()
    return render_template("board.html", projects=all_projects)

@app.route("/dashboard")
def dashboard():
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()
    return render_template("dashboard.html", projects=all_projects)
@app.route("/sprints")
def sprints():
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()    
    return render_template("sprints.html", projects=all_projects)

@app.route("/backlog")
def backlog():
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()
    return render_template("backlog.html", projects=all_projects)

@app.route("/chats")
def chats():
    return render_template("chats.html")

@app.route("/reports")
def reports():
    project_repo = RepositoryFactory.get_repository("project")    
    all_projects = project_repo.get_all()    
    return render_template("reports.html", projects=all_projects)
@app.route("/settings")
def settings():
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
if __name__ == "__main__":
    app.run(debug=True)