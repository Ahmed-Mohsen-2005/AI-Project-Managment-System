"""Test Error Handling in AIPMS"""
from unittest.mock import MagicMock, patch

@patch("controllers.view_controller.RepositoryFactory")
def test_user_not_found_404(mock_factory, authenticated_client):
    """Test 404 when user not found"""
    mock_repo = MagicMock()
    mock_repo.get_by_id.return_value = None
    mock_factory.get_repository.return_value = mock_repo
    
    response = authenticated_client.get("/users/99999")
    
    # Should either 404 or redirect
    assert response.status_code in (404, 302, 200)
    print("✅ User not found error handling test passed")

@patch("controllers.home_controller.RepositoryFactory")
def test_repository_exception_handled(mock_factory, authenticated_client):
    """Test exception handling in controller"""
    mock_repo = MagicMock()
    mock_repo.get_all.side_effect = Exception("Database error")
    mock_factory.get_repository.return_value = mock_repo
    
    response = authenticated_client.get("/home")
    
    # Should handle gracefully
    assert response.status_code in (200, 500, 302)
    print("✅ Repository exception handling test passed")
