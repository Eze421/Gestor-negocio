from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[int] = mapped_column(Integer, index=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), default=None)

    client: Mapped["Client | None"] = relationship(back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship(
        back_populates="sale",
        cascade="all, delete-orphan",
    )
    payments: Mapped[list["SalePayment"]] = relationship(
        back_populates="sale",
        cascade="all, delete-orphan",
    )
    cash_movements: Mapped[list["CashMovement"]] = relationship(back_populates="sale")
