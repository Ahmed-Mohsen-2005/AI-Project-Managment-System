import os
import mysql.connector
from mysql.connector import pooling, Error

class DatabaseConnection:
    _instance = None
    _pool = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            try:
                # 1. Read config from Docker Environment Variables
                db_host = os.getenv('DB_HOST', 'localhost')
                db_user = os.getenv('DB_USER', 'root')
                db_password = os.getenv('DB_PASSWORD', 'AhmedMohsen2005')
                db_name = os.getenv('DB_NAME', 'AIPMS')

                print(f"DEBUG: Connecting to {db_host} as {db_user}...")

                # 2. Initialize the pool
                cls._pool = pooling.MySQLConnectionPool(
                    pool_name="mypool",
                    pool_size=5,
                    pool_reset_session=True,
                    host=db_host,
                    user=db_user,
                    password=db_password,
                    database=db_name
                )
                print("Connection pool initialized successfully")
            except Error as e:
                print(f"Error creating connection pool: {e}")
                cls._pool = None # Ensure pool is None if failed
        return cls._instance

    def get_connection(self):
        """Returns a connection from the pool."""
        if self._pool is None:
             raise Exception("Database pool was not initialized.")
        return self._pool.get_connection()

# --- Helper function for your Controllers ---
def get_db():
    # FIX: Don't create a new connection manually! 
    # Use the singleton class to get a connection from the pool.
    db_instance = DatabaseConnection()
    conn = db_instance.get_connection()
    
    # Optional: Verify connection
    if conn.is_connected():
        print("Successfully retrieved connection from pool")
        
    return conn