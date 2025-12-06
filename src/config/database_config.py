import os
from dotenv import load_dotenv

load_dotenv()

# --- Database Credentials (MySQL) ---
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "AhmedMohsen2005") # Using the password from your query
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306") # Standard MySQL port
DB_NAME = os.getenv("DB_NAME", "AIPMS")

# Use the PyMySQL driver for SQLAlchemy connection
DB_TYPE = os.getenv("DB_TYPE", "mysql+pymysql") 

# --- Construct the Database URI ---
# Example MySQL URI format: mysql+pymysql://user:password@host:port/dbname
DATABASE_URI = (
    f"{DB_TYPE}://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# --- Other Application Settings ---
SECRET_KEY = os.getenv("SECRET_KEY", "Jana-Ahmed-Ali-Mazen-Hany-2025")