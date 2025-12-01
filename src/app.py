from flask import Flask
from controllers.user_controller import user_bp
from controllers.sprint_controller import sprint_bp
from controllers.task_controller import task_bp 
from controllers.report_controller import report_bp
from controllers.project_controller import project_bp
from controllers.notification_controller import notification_bp
from controllers.integration_controller import integration_bp
from controllers.file_attachment_controller import file_attachment_bp

app = Flask(__name__)
app.register_blueprint(user_bp)
app.register_blueprint(sprint_bp)
app.register_blueprint(task_bp)
app.register_blueprint(report_bp)
app.register_blueprint(project_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(integration_bp)
app.register_blueprint(file_attachment_bp)

@app.route("/")
def home():
    return """
    <h1>Welcome to our AI project management tool</h1>
    """

if __name__ == "__main__":
    app.run(debug=True)