from flask import Flask
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
from controllers.user_controller import user_bp
app = Flask(__name__)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)
app.register_blueprint(user_bp)

@app.route("/")
def home():
    return """
    <h1>Welcome to our AI project management tool</h1>
    """

if __name__ == "__main__":
    app.run(debug=True)