import os
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("fy_dry_db")

# Determine active database URL
db_url = settings.DATABASE_URL

# If DATABASE_URL is still placeholder or host is IPv6 only, fallback to Pooler or SQLite
if "TU_DATABASE_PASSWORD" in db_url or "TU_PASSWORD" in db_url:
    print("\n[AVISO DB]: DATABASE_URL tiene placeholder 'TU_DATABASE_PASSWORD'. Usando SQLite local 'sqlite:///./fydry.db' para desarrollo.")
    db_url = "sqlite:///./fydry.db"
elif "db.ndatbgiedkbzejavvchu.supabase.co" in db_url and settings.DATABASE_POOLER_URL and "TU_DATABASE_PASSWORD" not in settings.DATABASE_POOLER_URL:
    db_url = settings.DATABASE_POOLER_URL

connect_args = {}
if "sqlite" in db_url:
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=connect_args,
    )
except Exception as e:
    print(f"[ERROR DB]: Error conectando a PostgreSQL ({e}). Usando SQLite local de respaldo.")
    db_url = "sqlite:///./fydry.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Provides transactional database session with auto-close."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes and auto-creates all database tables and schema updates."""
    try:
        from app.models import Base
        Base.metadata.create_all(bind=engine)

        # Migración ligera automática para columnas añadidas
        with engine.begin() as conn:
            if "postgresql" in str(engine.url):
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;"))
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS budget_reset_day INTEGER DEFAULT 1;"))
            elif "sqlite" in str(engine.url):
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;"))
                except Exception:
                    pass
                try:
                    conn.execute(text("ALTER TABLE user_profiles ADD COLUMN budget_reset_day INTEGER DEFAULT 1;"))
                except Exception:
                    pass

        print("[OK DB]: Tablas y columnas de base de datos verificadas/creadas correctamente.")
    except Exception as exc:
        print(f"[ERROR DB]: Error al inicializar tablas: {exc}")
