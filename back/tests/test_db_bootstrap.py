from pathlib import Path

from app.db.bootstrap import ensure_sqlite_database_file


def test_ensure_sqlite_database_file_creates_parent_and_file(tmp_path: Path) -> None:
    database_path = tmp_path / "runtime-data" / "gestor_negocio.db"
    database_url = f"sqlite:///{database_path.as_posix()}"

    created_path = ensure_sqlite_database_file(database_url)

    assert created_path == database_path
    assert database_path.exists()
    assert database_path.is_file()


def test_ensure_sqlite_database_file_ignores_memory_database() -> None:
    created_path = ensure_sqlite_database_file("sqlite://")

    assert created_path is None
