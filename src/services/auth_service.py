from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from data.db_session import get_db

def check_db_connection():
    """
    Attempts to execute a simple query to verify the connection to SQL Server.
    Returns True if successful, raises an exception otherwise.
    """
    # Use the database dependency generator to get a session
    # This automatically handles session closing via the try/finally block in get_db()
    
    # We retrieve the session using the next(get_db()) pattern outside of a request context.
    try:
        # Get the session iterator
        db_generator = get_db()
        # Get the actual session object
        db = next(db_generator) 
        
        # Execute a simple, non-destructive SQL Server command (like checking the version)
        # Using sqlalchemy.text() prevents injection issues and works with raw SQL
        db.execute(text("SELECT @@VERSION"))
        
        print("✅ Database Connection Test Successful: SQL Server is reachable.")
        return True
    
    except OperationalError as e:
        # OperationalError typically indicates a connection problem (Host/Port/Auth)
        print("❌ Database Connection FAILED! Check configuration.")
        print(f"   Details: {e}")
        # Re-raise the error to stop the application if the connection is vital
        raise OperationalError("SQL Server connection failed during startup health check.")
    
    except Exception as e:
        print(f"⚠️ An unexpected error occurred during DB check: {e}")
        raise