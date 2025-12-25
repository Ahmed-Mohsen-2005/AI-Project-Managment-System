"""
Test Configuration for AIPMS
Provides fixtures for all tests
"""
import pytest
import sys
import os

# Get project root (parent of tests folder)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_path = os.path.join(project_root, 'src')

# Add src to Python path
if src_path not in sys.path:
    sys.path.insert(0, src_path)

print(f"[DEBUG] Project root: {project_root}")
print(f"[DEBUG] Src path: {src_path}")
print(f"[DEBUG] Src exists: {os.path.exists(src_path)}")

# Import from src
from app import create_app

@pytest.fixture
def app():
    """Create Flask application for testing"""
    flask_app = create_app()
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False
    flask_app.config['SERVER_NAME'] = 'localhost'
    
    yield flask_app

@pytest.fixture
def client(app):
    """Create Flask test client"""
    with app.test_client() as client:
        yield client

@pytest.fixture
def app_context(app):
    """Create application context"""
    with app.app_context():
        yield app

@pytest.fixture
def authenticated_client(client):
    """Create authenticated test client"""
    with client.session_transaction() as session:
        session['user_id'] = 1
        session['user_email'] = 'test@aipms.com'
        session['user_role'] = 'Project Manager'
    return client
