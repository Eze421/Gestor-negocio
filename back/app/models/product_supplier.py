from sqlalchemy import Column, ForeignKey, Table

from app.db.base import Base

product_supplier_table = Table(
    "product_suppliers",
    Base.metadata,
    Column("product_id", ForeignKey("products.id"), primary_key=True),
    Column("supplier_id", ForeignKey("suppliers.id"), primary_key=True),
)
