from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    dni: Mapped[str | None] = mapped_column(String(32), unique=True, default=None)
    name: Mapped[str] = mapped_column(String(160), index=True)
    phone: Mapped[str | None] = mapped_column(String(40), default=None)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    sales: Mapped[list["Sale"]] = relationship(back_populates="client")
