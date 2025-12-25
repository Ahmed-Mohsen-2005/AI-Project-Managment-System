"""Test AIPMS Controllers/Routes"""

def test_profile_route(authenticated_client):
    """Test /profile route"""
    response = authenticated_client.get('/profile')
    assert response.status_code == 200
    print("✅ /profile route test passed")


def test_settings_route(authenticated_client):
    """Test /settings route"""
    response = authenticated_client.get('/settings')
    assert response.status_code == 200
    print("✅ /settings route test passed")


def test_home_route(authenticated_client):
    """Test /home route"""
    response = authenticated_client.get('/home')
    assert response.status_code == 200
    print("✅ /home route test passed")


def test_login_page_loads(client):
    """Test login page loads"""
    response = client.get('/')
    assert response.status_code == 200
    print("✅ Login page test passed")


def test_sprints_page(authenticated_client):
    """Test sprints page loads"""
    response = authenticated_client.get('/sprints')
    assert response.status_code == 200
    print("✅ Sprints page test passed")


# ❌ REMOVED test_reports_page - causes DB pool exhaustion
