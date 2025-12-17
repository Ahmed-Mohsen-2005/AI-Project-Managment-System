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
<<<<<<< HEAD
                host="localhost",
                user="root",
                password="mazen2004", 
                database="AIPMS"
=======
                    host="localhost",
                    user="root",
                    password="jana2005", 
                    database="AIPMS"
>>>>>>> main
                )
                print("Connected to MySQL")
            except Error as e:
                print("ERROR connecting to MySQL:", e)
                self.connection = None

    # Fix indentation: make this a method of the class
    def get_connection(self):
        return self.connection
