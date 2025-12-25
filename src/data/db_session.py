import mysql.connector
from mysql.connector import pooling, Error

class DatabaseConnection:
    _instance = None
    _pool = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            try:
                # Initialize the pool once
                cls._pool = pooling.MySQLConnectionPool(
                    pool_name="mypool",
                    pool_size=5,
                    pool_reset_session=True,
                    host="localhost",
                    user="root",
                    password="mazen2004",
                    database="AIPMS"
                )
                print("Connection pool initialized")
            except Error as e:
                print(f"Error creating connection pool: {e}")
        return cls._instance

    def get_connection(self):
        """Returns a connection from the pool."""
        return self._pool.get_connection()

def get_db():
    """
    Retrieves a connection from the singleton pool.
    """
    db_instance = DatabaseConnection()
    return db_instance.get_connection()