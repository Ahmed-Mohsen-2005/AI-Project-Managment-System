from flask import Flask
from controllers.user_controller import user_bp
from controllers.sprint_controller import sprint_bp
from controllers.task_controller import task_bp 
from controllers.report_controller import report_bp
from controllers.project_controller import project_bp
from controllers.notification_controller import notification_bp
from controllers.integration_controller import integration_bp
from controllers.file_attachment_controller import file_attachment_bp
from config.database_config import SECRET_KEY
from data.db_session import get_db
from flask import Blueprint, render_template

home_bp = Blueprint("home", __name__)
def create_app():
    app = Flask(__name__)   
    db = get_db() 
    print("Project Sentinel Application and SQL Server connection pool initialized.")
    app.register_blueprint(home_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(sprint_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(integration_bp)
    app.register_blueprint(file_attachment_bp)
    return app
@home_bp.route("/")
def home():
    return render_template("home.html")


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)