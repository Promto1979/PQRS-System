from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de conexión a la base de datos MySQL (creada por el DBA)
# FORMATO: "mysql+pymysql://USER:PASSWORD@HOST/DB_NAME"
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/pqrs_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para obtener la sesión de BD en cada request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()