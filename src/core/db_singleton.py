import mysql.connector
from mysql.connector import Error

class DatabaseConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.connection = None
        return cls._instance

    def get_connection(self):
        if self.connection is None or not self.connection.is_connected():
            try:
                self.connection = mysql.connector.connect(
                    host="localhost",
                    user="root",
                    password="ali2005",
                    database="AIPMS"
                )
                print("Reconnected to MySQL")
            except Error as e:
                print("ERROR connecting to MySQL:", e)
                self.connection = None

        return self.connection

