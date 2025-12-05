from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
import mysql.connector
conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="AhmedMohsen2005",
        database="AIPMS"
    )

print(f"Connection Status: {conn.is_connected()}") 