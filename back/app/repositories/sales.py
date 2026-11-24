from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.sale import Sale
from app.models.sale_item import SaleItem


class SaleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _base_stmt(self) -> Select[tuple[Sale]]:
        return (
            select(Sale)
            .options(
                selectinload(Sale.client),
                selectinload(Sale.items).selectinload(SaleItem.product),
                selectinload(Sale.payments),
                selectinload(Sale.cash_movements),
            )
        )

    def list(self, *, pending_only: bool = False) -> list[Sale]:
        stmt = self._base_stmt().order_by(Sale.sold_at.desc())
        if pending_only:
            stmt = stmt.where(Sale.status.in_([0, 1]))
        return list(self.db.scalars(stmt).all())

    def get_by_id(self, sale_id: int) -> Sale | None:
        stmt = self._base_stmt().where(Sale.id == sale_id)
        return self.db.scalar(stmt)

    def create(self, sale: Sale) -> Sale:
        self.db.add(sale)
        self.db.flush()
        self.db.refresh(sale)
        return sale
