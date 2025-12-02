import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "fallback_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "fallback_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "1433") 
DB_NAME = os.getenv("DB_NAME", "project_sentinel_db")
DB_TYPE = os.getenv("DB_TYPE", "mssql+pyodbc") 
ODBC_DRIVER = os.getenv("ODBC_DRIVER", "ODBC Driver 17 for SQL Server")

DATABASE_URI = (
    f"{DB_TYPE}://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    f"?driver={ODBC_DRIVER.replace(' ', '+')}"
)

SECRET_KEY = os.getenv("SECRET_KEY", "A_very_long_and_secure_default_secret_key_12345")