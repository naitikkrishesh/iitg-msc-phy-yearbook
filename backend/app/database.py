from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL:  # remote DB (Aiven) -> TLS
    if settings.DB_SSL_CA:
        connect_args["ssl"] = {"ca": settings.DB_SSL_CA}
    else:
        connect_args["ssl"] = {"fake_flag_to_enable_tls": True}  # encrypts, does not verify cert

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()