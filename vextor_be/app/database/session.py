"""
Dependencia de sesión de base de datos para FastAPI
"""
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal


def get_db() -> Session:
    """
    Dependency que provee una sesión de base de datos.
    
    Uso en endpoints:
    ```python
    @router.get("/items")
    def get_items(db: Session = Depends(get_db)):
        return db.query(Item).all()
    ```
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


__all__ = ["get_db", "SessionLocal"]
