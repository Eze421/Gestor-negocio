from datetime import datetime
from pathlib import Path
import shutil
import sqlite3

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import settings
from app.db.session import engine, init_db

router = APIRouter()


def _resolve_sqlite_path() -> Path:
    db_url = settings.resolved_database_url
    if not db_url.startswith("sqlite:///"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El respaldo directo solo está disponible para SQLite local.",
        )
    raw_path = db_url.removeprefix("sqlite:///")
    return Path(raw_path).resolve()


@router.get("/backup")
def download_backup() -> FileResponse:
    db_path = _resolve_sqlite_path()
    if not db_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Base de datos no encontrada.")

    backup_dir = db_path.parent / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    snapshot_path = backup_dir / f"gestock_backup_{timestamp}.db"

    # Use sqlite3 online backup API so WAL is safely checkpointed into the snapshot
    src = sqlite3.connect(str(db_path))
    dst = sqlite3.connect(str(snapshot_path))
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()

    return FileResponse(
        path=str(snapshot_path),
        filename=f"gestock_backup_{timestamp}.db",
        media_type="application/octet-stream",
    )


@router.post("/restore")
async def restore_backup(file: UploadFile = File(...)) -> dict:
    db_path = _resolve_sqlite_path()
    content = await file.read()
    if len(content) < 100 or not content.startswith(b"SQLite format 3\x00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo seleccionado no es una base de datos SQLite válida.",
        )

    temp_path = db_path.with_suffix(".restore_tmp")
    safety_bak = db_path.with_suffix(".pre_restore_bak")

    temp_path.write_bytes(content)
    engine.dispose()

    if db_path.exists():
        shutil.copy2(db_path, safety_bak)

    # Remove WAL/SHM sidecars if present before replacing main db file
    for suffix in ("-wal", "-shm"):
        sidecar = Path(f"{db_path}{suffix}")
        if sidecar.exists():
            sidecar.unlink()

    shutil.move(str(temp_path), str(db_path))
    init_db()

    return {"status": "ok", "message": "Base de datos restaurada correctamente."}
