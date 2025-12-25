"""Test Database Singleton Pattern"""
from core.db_singleton import DatabaseConnection

def test_singleton_returns_same_instance():
    """Test DatabaseConnection returns the same instance"""
    db1 = DatabaseConnection()
    db2 = DatabaseConnection()
    
    assert db1 is db2, "Singleton should return the same instance"
    print("✅ Singleton pattern working correctly")

def test_singleton_has_connection_method():
    """Test singleton has get_connection method"""
    db = DatabaseConnection()
    assert hasattr(db, 'get_connection'), "Should have get_connection method"
    print("✅ Singleton has required methods")
