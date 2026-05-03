from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.client import Client


class ClientRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _base_stmt(self) -> Select[tuple[Client]]:
        return select(Client)

    def list(self, *, search: str | None = None, include_inactive: bool = False) -> list[Client]:
        stmt = self._base_stmt().order_by(Client.name.asc())

        if not include_inactive:
            stmt = stmt.where(Client.active.is_(True))
        if search:
            term = f"%{search.strip()}%"
            stmt = stmt.where((Client.name.ilike(term)) | (Client.dni.ilike(term)))

        return list(self.db.scalars(stmt).all())

    def get_by_id(self, client_id: int) -> Client | None:
        return self.db.get(Client, client_id)

    def get_by_dni(self, dni: str) -> Client | None:
        stmt = self._base_stmt().where(Client.dni == dni)
        return self.db.scalar(stmt)

    def create(self, client: Client) -> Client:
        self.db.add(client)
        self.db.flush()
        self.db.refresh(client)
        return client
