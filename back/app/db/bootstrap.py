from pathlib import Path


def ensure_sqlite_database_file(database_url: str) -> Path | None:
    if not database_url.startswith("sqlite:///") or database_url == "sqlite://":
        return None

    raw_path = database_url.removeprefix("sqlite:///")
    if raw_path in {":memory:", ""}:
        return None

    database_path = Path(raw_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    database_path.touch(exist_ok=True)
    return database_path
