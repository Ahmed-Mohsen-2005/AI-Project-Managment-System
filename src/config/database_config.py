import os
from dotenv import load_dotenv

load_dotenv()
DB_USER = os.getenv("DB_USER", "fallback_user")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "1433") 
DB_NAME = os.getenv("DB_NAME", "AIPMS")

DB_TYPE = os.getenv("DB_TYPE", "mssql+pyodbc") 
ODBC_DRIVER = os.getenv("ODBC_DRIVER", "ODBC Driver 17 for SQL Server")


CONNECTION_STRING_PARAMS = (
    f"DRIVER={{{ODBC_DRIVER}}};"
    f"SERVER={DB_HOST},{DB_PORT};"
    f"DATABASE={DB_NAME};"
)

if os.getenv("USE_WINDOWS_AUTH", "False").upper() == "TRUE":
    CONNECTION_STRING_PARAMS += "Trusted_Connection=yes;"
    
    DATABASE_URI = f"mssql+pyodbc:///?odbc_connect={CONNECTION_STRING_PARAMS.replace(' ', '%20')}"
else:
    DB_PASSWORD = os.getenv("DB_PASSWORD", "") 
    DATABASE_URI = (
        f"{DB_TYPE}://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        f"?driver={ODBC_DRIVER.replace(' ', '+')}"
    )


SECRET_KEY = os.getenv("SECRET_KEY", "Jana-Ahmed-Ali-Mazen-Hany-2025")