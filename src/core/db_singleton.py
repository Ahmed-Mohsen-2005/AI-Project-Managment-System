import mysql.connector
from mysql.connector import Error

class DatabaseConnection:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
        return cls._instance
    def __init__(self):
        if not hasattr(self, "connection") or self.connection is None:
            try:
                self.connection = mysql.connector.connect(
                host="localhost",
                user="root",
                password="AhmedMohsen2005", 
                database="AIPMS"
                )
                print(" Connected to MySQL")
            except Error as e:
                print(" ERROR connecting to MySQL:", e)
                self.connection = None

    def get_connection(self):
        return self.connection