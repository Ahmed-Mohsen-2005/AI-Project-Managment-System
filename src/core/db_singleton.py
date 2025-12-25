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
                # 1. READ DOCKER ENV VARS (Force it to use 'mysql-db')
                db_host = os.getenv('DB_HOST', 'localhost')
                db_user = os.getenv('DB_USER', 'root')
                db_password = os.getenv('DB_PASSWORD', 'AhmedMohsen2005')
                db_name = os.getenv('DB_NAME', 'AIPMS')

                print(f"DEBUG (Core Singleton): Connecting to {db_host}...")

                # 2. Initialize the pool
                cls._pool = pooling.MySQLConnectionPool(
                    pool_name="mypool_core", # Unique name for this pool
                    pool_size=5,
                    pool_reset_session=True,
                    host="localhost",
                    user="root",
                    password="jana2005",
                    database="AIPMS"
                )
                print("Core Connection pool initialized successfully")
            except Error as e:
                print(f"Error creating core connection pool: {e}")
                cls._pool = None
        return cls._instance

    def get_connection(self):
        """Returns a connection from the pool."""
        # 3. SELF-HEALING: If pool is dead, try to restart it
        if self._pool is None:
             print("Core Pool was None, attempting to re-initialize...")
             self.__new__(self.__class__)
             
        # 4. SAFETY CHECK: Don't crash with AttributeError, give a real error
        if self._pool is None:
             raise Exception("CRITICAL ERROR: Core Database pool failed to initialize. Check DB_HOST.")
             
        return self._pool.get_connection()