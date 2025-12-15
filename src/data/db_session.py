from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
import mysql.connector
def get_db():
    conn = mysql.connector.connect(
            host="localhost",
            user="root",
<<<<<<< HEAD
            password="mazen2004",
=======
            password="ali2005",
>>>>>>> 2f8b3c7c4f9e9ed46a4bccf498ed0f5c86fa730b
            database="AIPMS"
        )

    print(f"Connection Status: {conn.is_connected()}") 