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
                # 1. READ DOCKER ENV VARS (Crucial Fix)
                db_host = os.getenv('DB_HOST', 'localhost')
                db_user = os.getenv('DB_USER', 'root')
                db_password = os.getenv('DB_PASSWORD', 'mazen2004')
                db_name = os.getenv('DB_NAME', 'AIPMS')

                print(f"DEBUG (Data Session): Connecting to {db_host}...")

                cls._pool = pooling.MySQLConnectionPool(
                    pool_name="mypool",
                    pool_size=5,
                    pool_reset_session=True,
                    host=db_host,
                    user=db_user,
                    password=db_password,
                    database=db_name
                )
                print("Connection pool initialized successfully in data/db_session")
            except Error as e:
                print(f"Error creating connection pool: {e}")
                cls._pool = None
        return cls._instance

    def get_connection(self):
        if self._pool is None:
             self.__new__(self.__class__)
        if self._pool is None:
             raise Exception("Database pool failed to initialize.")
        return self._pool.get_connection()

# 2. ADD THIS MISSING FUNCTION (Crucial Fix)
def get_db():
    """
    Retrieves a connection from the Singleton pool.
    """
    db_instance = DatabaseConnection()
    return db_instance.get_connection()
