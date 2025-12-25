import os

class Config:
    # 1. Fetch Environment Variables (with defaults for local testing)
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'AhmedMohsen2005')
    DB_HOST = os.environ.get('DB_HOST', 'localhost') # Docker will set this to 'mysql-db'
    DB_PORT = os.environ.get('DB_PORT', '3306')
    DB_NAME = os.environ.get('DB_NAME', 'AIPMS')
    
    # 2. Construct the Connection String
    # We use 'mysql+pymysql' as the driver
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_key')
