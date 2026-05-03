from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.product_category import product_category_table
from app.models.product_supplier import product_supplier_table


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    stock: Mapped[int] = mapped_column(default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    categories: Mapped[list["Category"]] = relationship(
        secondary=product_category_table,
        back_populates="products",
    )
    suppliers: Mapped[list["Supplier"]] = relationship(
        secondary=product_supplier_table,
        back_populates="products",
    )
    sale_items: Mapped[list["SaleItem"]] = relationship(back_populates="product")
