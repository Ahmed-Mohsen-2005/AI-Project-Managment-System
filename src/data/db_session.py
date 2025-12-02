from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
from config.database_config import DATABASE_URI

Base = declarative_base()
engine = create_engine(DATABASE_URI, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
ScopedSession = scoped_session(SessionLocal)

def get_db():
    db = ScopedSession()
    try:
        yield db
    finally:
        db.close() 
