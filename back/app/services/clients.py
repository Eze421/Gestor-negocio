from sqlalchemy.orm import Session

from app.models.client import Client
from app.repositories.clients import ClientRepository
from app.schemas.client import ClientCreate, ClientUpdate
from app.services.catalog import _normalize_name


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


class ClientService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = ClientRepository(db)

    def list_clients(self, *, search: str | None = None, include_inactive: bool = False) -> list[Client]:
        return self.repository.list(search=search, include_inactive=include_inactive)

    def get_client(self, client_id: int) -> Client:
        client = self.repository.get_by_id(client_id)
        if client is None:
            raise LookupError("Cliente no encontrado")
        return client

    def create_client(self, payload: ClientCreate) -> Client:
        dni = _normalize_optional_text(payload.dni)
        if dni and self.repository.get_by_dni(dni):
            raise ValueError("Ya existe un cliente con ese DNI")

        client = Client(
            dni=dni,
            name=_normalize_name(payload.name),
            phone=_normalize_optional_text(payload.phone),
            active=payload.active,
        )
        self.repository.create(client)
        self.db.commit()
        return client

    def update_client(self, client_id: int, payload: ClientUpdate) -> Client:
        client = self.get_client(client_id)

        if payload.dni is not None:
            dni = _normalize_optional_text(payload.dni)
            if dni:
                existing = self.repository.get_by_dni(dni)
                if existing and existing.id != client.id:
                    raise ValueError("Ya existe un cliente con ese DNI")
            client.dni = dni

        if payload.name is not None:
            client.name = _normalize_name(payload.name)
        if payload.phone is not None:
            client.phone = _normalize_optional_text(payload.phone)
        if payload.active is not None:
            client.active = payload.active

        self.db.commit()
        self.db.refresh(client)
        return client

    def delete_client(self, client_id: int) -> None:
        client = self.get_client(client_id)
        client.active = False
        self.db.commit()
