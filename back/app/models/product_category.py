from sqlalchemy import ForeignKey, Table, Column

from app.db.base import Base

product_category_table = Table(
    "product_categories",
    Base.metadata,
    Column("product_id", ForeignKey("products.id"), primary_key=True),
    Column("category_id", ForeignKey("categories.id"), primary_key=True),
)
