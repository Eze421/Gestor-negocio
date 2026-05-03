from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.supplier import Supplier


class SupplierRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _base_stmt(self) -> Select[tuple[Supplier]]:
        return select(Supplier).options(selectinload(Supplier.products))

    def list(self, *, search: str | None = None) -> list[Supplier]:
        stmt = self._base_stmt().order_by(Supplier.name.asc())

        if search:
            term = f"%{search.strip()}%"
            stmt = stmt.where(Supplier.name.ilike(term))

        return list(self.db.scalars(stmt).all())

    def get_by_id(self, supplier_id: int) -> Supplier | None:
        stmt = self._base_stmt().where(Supplier.id == supplier_id)
        return self.db.scalar(stmt)

    def get_by_name(self, name: str) -> Supplier | None:
        stmt = self._base_stmt().where(Supplier.name == name)
        return self.db.scalar(stmt)

    def create(self, supplier: Supplier) -> Supplier:
        self.db.add(supplier)
        self.db.flush()
        self.db.refresh(supplier)
        return supplier

    def delete(self, supplier: Supplier) -> None:
        self.db.delete(supplier)
