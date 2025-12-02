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
from data.db_session import ScopedSession, get_db
from flask import Blueprint

home_bp = Blueprint("home", __name__)
def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY
    app.register_blueprint(home_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(sprint_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(integration_bp)
    app.register_blueprint(file_attachment_bp)
    @app.teardown_appcontext
    def remove_session(exception=None):
        ScopedSession.remove()
    return app

@home_bp.route("/")
def home():
    return """
    <h1>Welcome to our AI project management tool</h1>
    """

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)