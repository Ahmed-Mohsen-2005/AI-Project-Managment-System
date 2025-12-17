from flask import Flask
from controllers.user_controller import user_bp
from controllers.sprint_controller import sprint_bp
from controllers.task_controller import task_bp 
from controllers.report_controller import report_bp
from controllers.project_controller import project_bp
from controllers.notification_controller import notification_bp
from controllers.integration_controller import integration_bp
from controllers.file_attachment_controller import file_attachment_bp
from controllers.auth_controller import auth_bp
from controllers.home_controller import home_bp
from config.database_config import SECRET_KEY
from data.db_session import get_db
from controllers.view_controller import view_bp  
from flask import Blueprint, render_template
from services.task_service import TaskService
app = Flask(__name__)   
db = get_db() 
print("Project Sentinel Application and SQL Server connection pool initialized.")
app.register_blueprint(user_bp)
app.register_blueprint(sprint_bp)
app.register_blueprint(task_bp)
app.register_blueprint(report_bp)
app.register_blueprint(view_bp)
app.register_blueprint(project_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(integration_bp)
app.register_blueprint(file_attachment_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)

@app.route("/")
def root():
    return render_template("index.html")
@app.route("/home")
def home():
    task_service = TaskService()
    tasks = task_service.get_all_tasks()
    return render_template("home.html", tasks=tasks)
@app.route("/repositories")
def repositories():
    return render_template("repositories.html")

@app.route("/boards/board")
def board():
    return render_template("board/board.html")

@app.route("/boards/dashboard")
def dashboard():
    return render_template("board/dashboard.html")

@app.route("/boards/sprints")
def sprints():
    return render_template("board/sprints.html")

@app.route("/boards/backlog")
def backlog():
    return render_template("board/backlog.html")

@app.route("/chats")
def chats():
    return render_template("chats.html")

@app.route("/reports")
def reports():
    return render_template("reports.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

@app.route("/profile")
def profile():
    return render_template("profile.html")


if __name__ == "__main__":
    app.run(debug=True)