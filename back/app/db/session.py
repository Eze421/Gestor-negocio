import sqlite3

from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import sessionmaker

from app.core.constants import DEFAULT_CATEGORY_NAME
from app.core.config import settings
from app.db.base import Base
from app.db.bootstrap import ensure_sqlite_database_file
import app.models  # noqa: F401
from app.models.category import Category

database_url = settings.resolved_database_url
ensure_sqlite_database_file(database_url)

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(engine, "connect")
def configure_sqlite(dbapi_connection: sqlite3.Connection, _: object) -> None:
    if not isinstance(dbapi_connection, sqlite3.Connection):
        return

    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("PRAGMA journal_mode = WAL")
    cursor.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        default_category = db.scalar(
            select(Category).where(Category.name == DEFAULT_CATEGORY_NAME)
        )
        if default_category is None:
            db.add(Category(name=DEFAULT_CATEGORY_NAME))
            db.commit()
